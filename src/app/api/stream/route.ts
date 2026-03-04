import { NextRequest } from 'next/server'

// SSE endpoint for real-time observation feed
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = {
        type: 'connection',
        title: 'Connected to Mission Control',
        subtitle: 'Real-time observation feed active',
        timestamp: new Date().toISOString(),
        agent: 'gateway',
        emoji: '🦞',
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`))

      // In production, subscribe to claude-mem worker SSE
      // and forward events to this stream

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Simulate mock observations for demo
      const mockInterval = setInterval(() => {
        const observations = [
          {
            type: 'decision',
            title: 'Model routing decision',
            subtitle: 'Selected Kimi K2 for coding task',
            agent: 'gateway',
            emoji: '🦞',
          },
          {
            type: 'feature',
            title: 'Signal detected',
            subtitle: 'BTC/USDT bullish divergence',
            agent: 'trading',
            emoji: '📈',
          },
          {
            type: 'change',
            title: 'Configuration updated',
            subtitle: 'Health check interval adjusted',
            agent: 'devops',
            emoji: '🔧',
          },
          {
            type: 'discovery',
            title: 'Pattern recognized',
            subtitle: 'API rate limit optimization found',
            agent: 'research',
            emoji: '🔍',
          },
        ]

        const observation = observations[Math.floor(Math.random() * observations.length)]
        const event = {
          ...observation,
          timestamp: new Date().toISOString(),
          id: crypto.randomUUID(),
        }

        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          clearInterval(mockInterval)
          clearInterval(heartbeat)
        }
      }, 10000) // Every 10 seconds for demo

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(mockInterval)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
