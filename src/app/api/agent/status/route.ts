import { NextRequest } from 'next/server'
import { validateApiKey, unauthorizedResponse, successResponse, errorResponse } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

const VPS_HOST = process.env.VPS_HOST || '31.97.128.136'
const GATEWAY_PORT = 18789
const N8N_PORT = 5678

async function checkEndpoint(url: string, timeout = 5000): Promise<{ online: boolean; latency: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    return {
      online: response.ok || response.status === 101 || response.status === 426,
      latency: Date.now() - start,
    }
  } catch {
    return { online: false, latency: Date.now() - start }
  }
}

export async function GET(request: NextRequest) {
  // Auth check
  const auth = validateApiKey(request)
  if (!auth.isValid) {
    return unauthorizedResponse(auth.error!)
  }

  // Rate limit check
  const rateLimit = checkRateLimit(request, 'status')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn)
  }

  try {
    // Check gateway health
    const gateway = await checkEndpoint(`http://${VPS_HOST}:${GATEWAY_PORT}`)

    // Check n8n health
    const n8n = await checkEndpoint(`http://${VPS_HOST}:${N8N_PORT}/healthz`)

    // Calculate uptime (mock for now)
    const startTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 14 * 60 * 60 * 1000 - 22 * 60 * 1000)
    const uptimeMs = Date.now() - startTime.getTime()
    const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000))

    const result = successResponse({
      gateway: {
        status: gateway.online ? 'online' : 'offline',
        latency: gateway.latency,
        host: VPS_HOST,
        port: GATEWAY_PORT,
      },
      n8n: {
        status: n8n.online ? 'online' : 'offline',
        latency: n8n.latency,
        workflows: 12, // Would fetch from n8n API
      },
      database: {
        status: 'online',
        size: '24.5 MB',
        type: 'SQLite + FTS5',
      },
      memory: {
        status: 'online',
        usage: '156 MB',
      },
      currentModel: 'moonshotai/kimi-k2-thinking',
      uptime: `${days}d ${hours}h ${minutes}m`,
      lastHealthCheck: new Date().toISOString(),
      fallbackChain: [
        'moonshotai/kimi-k2-thinking',
        'minimaxai/minimax-m2.1',
        'google/gemini-2.0-flash',
        'google-gemini-cli/gemini-3-pro-preview',
      ],
    })

    return addRateLimitHeaders(result, rateLimit.remaining, rateLimit.resetIn)
  } catch (error) {
    console.error('Status API error:', error)
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}
