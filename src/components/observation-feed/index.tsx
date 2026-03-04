'use client'

import { useState, useEffect, useRef } from 'react'
import { Radio, Pause, Play, Filter, Download } from 'lucide-react'

interface Observation {
  id: number
  type: 'decision' | 'bugfix' | 'feature' | 'refactor' | 'discovery' | 'change'
  title: string
  subtitle?: string
  timestamp: Date
  agent?: string
  emoji?: string
}

export function ObservationFeed() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (isPaused) return

    // Connect to SSE endpoint
    const connectSSE = () => {
      eventSourceRef.current = new EventSource('/api/stream')

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const newObservation: Observation = {
            id: Date.now(),
            type: data.type || 'change',
            title: data.title,
            subtitle: data.subtitle,
            timestamp: new Date(),
            agent: data.agent,
            emoji: data.emoji,
          }
          setObservations((prev) => [newObservation, ...prev.slice(0, 99)])
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
        }
      }

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close()
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [isPaused])

  const getTypeBadge = (type: Observation['type']) => {
    const badges: Record<Observation['type'], string> = {
      decision: 'badge-info',
      bugfix: 'badge-error',
      feature: 'badge-success',
      refactor: 'badge-warning',
      discovery: 'badge-info',
      change: 'badge-warning',
    }
    return badges[type] || 'badge-info'
  }

  const filteredObservations = filter
    ? observations.filter((o) => o.agent === filter)
    : observations

  const uniqueAgents = [...new Set(observations.map((o) => o.agent).filter(Boolean))]

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return date.toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-4 h-4 ${isPaused ? 'text-[var(--warning)]' : 'text-[var(--success)] animate-pulse'}`}
            />
            <h3 className="text-lg font-semibold">Observation Feed</h3>
          </div>
          {!isPaused && <span className="badge badge-success">LIVE</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-sm">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Agent Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === null
                ? 'bg-[var(--accent)] text-[var(--background)]'
                : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            All
          </button>
          {uniqueAgents.map((agent) => (
            <button
              key={agent}
              onClick={() => setFilter(agent!)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filter === agent
                  ? 'bg-[var(--accent)] text-[var(--background)]'
                  : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {observations.find((o) => o.agent === agent)?.emoji} {agent}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div ref={feedRef} className="glass-panel p-4 h-[calc(100vh-300px)] overflow-y-auto space-y-3">
        {filteredObservations.map((observation) => (
          <div
            key={observation.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] transition-all border-l-2 border-[var(--accent)]"
          >
            <span className="text-xl">{observation.emoji || '🦀'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge ${getTypeBadge(observation.type)}`}>
                  {observation.type.toUpperCase()}
                </span>
                {observation.agent && (
                  <span className="text-xs text-[var(--foreground-muted)]">
                    via {observation.agent}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium">{observation.title}</div>
              {observation.subtitle && (
                <div className="text-xs text-[var(--foreground-muted)] mt-1">
                  {observation.subtitle}
                </div>
              )}
            </div>
            <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
              {formatTime(observation.timestamp)}
            </span>
          </div>
        ))}

        {filteredObservations.length === 0 && (
          <div className="text-center text-[var(--foreground-muted)] py-8">
            No observations yet
          </div>
        )}
      </div>
    </div>
  )
}
