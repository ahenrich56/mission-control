import { NextRequest } from 'next/server'
import {
  validateApiKey,
  unauthorizedResponse,
  successResponse,
  errorResponse,
} from '@/lib/auth'
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY
const NVIDIA_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'

const modelConfigs: Record<string, { temperature: number; topP: number; maxTokens: number }> = {
  'moonshotai/kimi-k2-thinking': { temperature: 1, topP: 0.9, maxTokens: 16384 },
  'minimaxai/minimax-m2.1': { temperature: 1, topP: 0.95, maxTokens: 8192 },
  'google/gemini-2.0-flash': { temperature: 0.7, topP: 0.9, maxTokens: 8192 },
}

function classifyTask(message: string): 'coding' | 'creative' | 'structured' | 'general' {
  const codingPatterns = /\b(code|function|implement|debug|fix|error|typescript|javascript|python|api|bug)\b/i
  const creativePatterns = /\b(write|story|describe|imagine|creative|content|blog|article|tweet)\b/i
  const structuredPatterns = /\b(json|extract|parse|format|list|table|data)\b/i

  if (codingPatterns.test(message)) return 'coding'
  if (creativePatterns.test(message)) return 'creative'
  if (structuredPatterns.test(message)) return 'structured'
  return 'general'
}

function selectModel(taskType: string, requestedModel?: string): string {
  if (requestedModel && requestedModel !== 'auto') {
    return requestedModel
  }

  switch (taskType) {
    case 'coding':
      return 'moonshotai/kimi-k2-thinking'
    case 'creative':
      return 'minimaxai/minimax-m2.1'
    case 'structured':
      return 'google/gemini-2.0-flash'
    default:
      return 'moonshotai/kimi-k2-thinking'
  }
}

export async function POST(request: NextRequest) {
  // Auth check
  const auth = validateApiKey(request)
  if (!auth.isValid) {
    return unauthorizedResponse(auth.error!)
  }

  // Rate limit check
  const rateLimit = checkRateLimit(request, 'chat')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn)
  }

  try {
    const body = await request.json()
    const { message, model: requestedModel } = body

    if (!message) {
      return errorResponse('BAD_REQUEST', 'Message is required', 400)
    }

    // Intelligent routing
    const taskType = classifyTask(message)
    const model = selectModel(taskType, requestedModel)
    const config = modelConfigs[model] || modelConfigs['moonshotai/kimi-k2-thinking']

    // Call NVIDIA NIM API
    const response = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are OpenClaw, an autonomous AI agent system. Be helpful, concise, and technical.',
          },
          { role: 'user', content: message },
        ],
        temperature: config.temperature,
        top_p: config.topP,
        max_tokens: config.maxTokens,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return errorResponse('MODEL_ERROR', `Model API error: ${errorText}`, 502)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'No response generated'
    const thinking = data.choices?.[0]?.message?.reasoning_content // Kimi K2 thinking

    const result = successResponse(
      {
        content,
        thinking,
        model,
        taskType,
      },
      {
        requestId: crypto.randomUUID(),
        model,
        tokens: data.usage?.total_tokens || 0,
      }
    )

    return addRateLimitHeaders(result, rateLimit.remaining, rateLimit.resetIn)
  } catch (error) {
    console.error('Chat API error:', error)
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}
