import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  requests: number
  window: string // e.g., '1m', '1h'
}

interface RateLimitState {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitState>()

const windowToMs: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '1h': 60 * 60 * 1000,
}

export const rateLimits: Record<string, RateLimitConfig> = {
  chat: { requests: 60, window: '1m' },
  task: { requests: 30, window: '1m' },
  status: { requests: 120, window: '1m' },
  models: { requests: 120, window: '1m' },
  render: { requests: 10, window: '1m' },
}

export function checkRateLimit(
  request: NextRequest,
  endpoint: keyof typeof rateLimits
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = rateLimits[endpoint]
  if (!config) {
    return { allowed: true, remaining: 999, resetIn: 0 }
  }

  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${endpoint}:${clientIp}`
  const windowMs = windowToMs[config.window] || 60000
  const now = Date.now()

  let state = rateLimitStore.get(key)

  // Reset if window expired
  if (!state || now > state.resetTime) {
    state = {
      count: 0,
      resetTime: now + windowMs,
    }
  }

  state.count++
  rateLimitStore.set(key, state)

  const remaining = Math.max(0, config.requests - state.count)
  const resetIn = Math.ceil((state.resetTime - now) / 1000)

  return {
    allowed: state.count <= config.requests,
    remaining,
    resetIn,
  }
}

export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Retry after ${resetIn} seconds.`,
        retryAfter: resetIn,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': resetIn.toString(),
      },
    }
  )
}

export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetIn: number
): NextResponse {
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetIn.toString())
  return response
}
