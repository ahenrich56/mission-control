import { NextRequest } from 'next/server'
import { validateApiKey, unauthorizedResponse, successResponse } from '@/lib/auth'
import { checkRateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

const models = [
  {
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'NVIDIA NIM (Moonshot AI)',
    description: 'Best for coding, technical analysis, debugging, and chain-of-thought reasoning',
    capabilities: ['coding', 'reasoning', 'analysis', 'debugging'],
    contextWindow: 128000,
    maxTokens: 16384,
    supportsReasoningContent: true,
    status: 'active',
    tier: 'primary',
  },
  {
    id: 'minimaxai/minimax-m2.1',
    name: 'MiniMax M2.1',
    provider: 'NVIDIA NIM (MiniMax)',
    description: 'Best for creative content, multimodal tasks, and long-context reasoning',
    capabilities: ['creative', 'content', 'multimodal', 'long-context'],
    contextWindow: 32000,
    maxTokens: 8192,
    supportsReasoningContent: false,
    status: 'active',
    tier: 'fallback-1',
  },
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Fast responses for general tasks and structured data extraction',
    capabilities: ['general', 'structured', 'fast'],
    contextWindow: 1000000,
    maxTokens: 8192,
    supportsReasoningContent: false,
    status: 'active',
    tier: 'fallback-2',
  },
  {
    id: 'google-gemini-cli/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'Google',
    description: 'Complex reasoning and advanced tasks',
    capabilities: ['reasoning', 'complex', 'advanced'],
    contextWindow: 1000000,
    maxTokens: 8192,
    supportsReasoningContent: false,
    status: 'active',
    tier: 'fallback-3',
  },
]

export async function GET(request: NextRequest) {
  // Auth check
  const auth = validateApiKey(request)
  if (!auth.isValid) {
    return unauthorizedResponse(auth.error!)
  }

  // Rate limit check
  const rateLimit = checkRateLimit(request, 'models')
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn)
  }

  const result = successResponse({
    models,
    currentModel: 'moonshotai/kimi-k2-thinking',
    routing: {
      enabled: true,
      strategy: 'intelligent',
      taskMapping: {
        coding: 'moonshotai/kimi-k2-thinking',
        reasoning: 'moonshotai/kimi-k2-thinking',
        creative: 'minimaxai/minimax-m2.1',
        structured: 'google/gemini-2.0-flash',
        default: 'moonshotai/kimi-k2-thinking',
      },
    },
    fallbackChain: models.map((m) => m.id),
  })

  return addRateLimitHeaders(result, rateLimit.remaining, rateLimit.resetIn)
}
