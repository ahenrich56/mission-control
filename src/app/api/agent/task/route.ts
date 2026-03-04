import { NextRequest } from 'next/server'
import { validateApiKey, unauthorizedResponse, successResponse, errorResponse } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

// In production, use Supabase client
// import { createClient } from '@supabase/supabase-js'

type TaskType = 'ping' | 'shell' | 'claw_navigation' | 'render' | 'signal_scan'

interface TaskPayload {
  type: TaskType
  payload: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high'
}

const validTaskTypes: TaskType[] = ['ping', 'shell', 'claw_navigation', 'render', 'signal_scan']

export async function POST(request: NextRequest) {
  // Auth check
  const auth = validateApiKey(request)
  if (!auth.isValid) {
    return unauthorizedResponse(auth.error!)
  }

  // Rate limit check
  const rateLimit = checkRateLimit(request, 'task')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn)
  }

  try {
    const body: TaskPayload = await request.json()
    const { type, payload, priority = 'normal' } = body

    if (!type || !validTaskTypes.includes(type)) {
      return errorResponse(
        'BAD_REQUEST',
        `Invalid task type. Valid types: ${validTaskTypes.join(', ')}`,
        400
      )
    }

    if (!payload || typeof payload !== 'object') {
      return errorResponse('BAD_REQUEST', 'Payload must be an object', 400)
    }

    // Create task in Supabase (mock for now)
    const taskId = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    // In production:
    // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    // const { data, error } = await supabase.from('tasks').insert({
    //   id: taskId,
    //   type,
    //   payload,
    //   status: 'pending',
    //   priority,
    //   created_at: createdAt,
    // }).select().single()

    const result = successResponse(
      {
        taskId,
        type,
        payload,
        status: 'pending',
        priority,
        createdAt,
        message: 'Task dispatched to VPS worker',
      },
      {
        requestId: crypto.randomUUID(),
        estimatedWait: priority === 'high' ? '< 5s' : priority === 'normal' ? '< 30s' : '< 60s',
      }
    )

    return addRateLimitHeaders(result, rateLimit.remaining, rateLimit.resetIn)
  } catch (error) {
    console.error('Task API error:', error)
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}

export async function GET(request: NextRequest) {
  // Auth check
  const auth = validateApiKey(request)
  if (!auth.isValid) {
    return unauthorizedResponse(auth.error!)
  }

  // Rate limit check
  const rateLimit = checkRateLimit(request, 'task')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn)
  }

  const url = new URL(request.url)
  const taskId = url.searchParams.get('id')

  if (!taskId) {
    // Return recent tasks
    const result = successResponse({
      tasks: [
        {
          id: 'mock-task-1',
          type: 'ping',
          payload: { target: 'gateway' },
          status: 'completed',
          result: 'pong',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          finishedAt: new Date(Date.now() - 55000).toISOString(),
        },
      ],
      total: 1,
    })
    return addRateLimitHeaders(result, rateLimit.remaining, rateLimit.resetIn)
  }

  // Return specific task (mock)
  const result = successResponse({
    id: taskId,
    type: 'ping',
    payload: { target: 'gateway' },
    status: 'completed',
    result: 'pong',
    createdAt: new Date(Date.now() - 60000).toISOString(),
    finishedAt: new Date(Date.now() - 55000).toISOString(),
  })

  return addRateLimitHeaders(result, rateLimit.remaining, rateLimit.resetIn)
}
