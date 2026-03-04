'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  thinking?: string
}

const models = [
  { id: 'auto', label: 'Auto (Intelligent Routing)', description: 'Automatically selects best model' },
  { id: 'moonshotai/kimi-k2-thinking', label: 'Kimi K2 Thinking', description: 'Best for coding & analysis' },
  { id: 'minimaxai/minimax-m2.1', label: 'MiniMax M2.1', description: 'Best for creative content' },
  { id: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fast responses' },
]

export function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Mission Control initialized. OpenClaw ready for commands.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('auto')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'No response received.',
        timestamp: new Date(),
        model: data.model,
        thinking: data.thinking,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Model Selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setShowModelDropdown(!showModelDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
        >
          <span className="text-sm text-[var(--foreground-muted)]">Model:</span>
          <span className="text-sm text-[var(--accent)]">
            {models.find((m) => m.id === selectedModel)?.label}
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
        </button>

        {showModelDropdown && (
          <div className="absolute top-full left-0 mt-2 w-80 glass-panel p-2 z-50">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id)
                  setShowModelDropdown(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  selectedModel === model.id
                    ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
                    : 'hover:bg-[var(--background-tertiary)]'
                }`}
              >
                <div className="text-sm font-medium">{model.label}</div>
                <div className="text-xs text-[var(--foreground-muted)]">{model.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-panel p-4 space-y-4 terminal">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user'
                ? 'ml-12 bg-[var(--accent-glow)] border border-[var(--accent)] border-opacity-30'
                : message.role === 'system'
                ? 'bg-[var(--background-tertiary)] border border-[var(--border)] opacity-75'
                : 'mr-12 bg-[var(--background-secondary)] border border-[var(--border)]'
            } rounded-lg p-3`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-medium ${
                  message.role === 'user'
                    ? 'text-[var(--accent)]'
                    : message.role === 'system'
                    ? 'text-[var(--warning)]'
                    : 'text-[var(--info)]'
                }`}
              >
                {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'OpenClaw'}
              </span>
              {message.model && (
                <span className="text-xs text-[var(--foreground-muted)]">via {message.model}</span>
              )}
              <span className="text-xs text-[var(--foreground-muted)] ml-auto">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>

            {message.thinking && (
              <details className="mb-2">
                <summary className="text-xs text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--accent)]">
                  Show thinking process
                </summary>
                <div className="mt-2 p-2 rounded bg-[var(--background)] text-xs text-[var(--foreground-muted)] whitespace-pre-wrap">
                  {message.thinking}
                </div>
              </details>
            )}

            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none terminal"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--background)] font-medium hover:bg-[var(--accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-accent"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
