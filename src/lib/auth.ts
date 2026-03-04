import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.OPENCLAW_API_KEY || 'dev-api-key'

interface AuthResult {
  isValid: boolean
  error?: string
}

export function validateApiKey(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return { isValid: false, error: 'Missing Authorization header' }
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { isValid: false, error: 'Invalid Authorization header format. Use: Bearer <api_key>' }
  }

  const token = parts[1]
  if (token !== API_KEY) {
    return { isValid: false, error: 'Invalid API key' }
  }

  return { isValid: true }
}

export function unauthorizedResponse(error: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error,
      },
    },
    { status: 401 }
  )
}

export function errorResponse(code: string, message: string, status = 500): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  )
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta,
  })
}
