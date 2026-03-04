'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Square, MoreVertical, Clock, Activity, RefreshCw } from 'lucide-react'

interface SubAgent {
  id: string
  emoji: string
  name: string
  status: 'idle' | 'working' | 'paused' | 'error'
  currentTask: string | null
  lastActivity: Date
  completedTasks: number
  logs: { time: Date; message: string }[]
}

export function AgentFleet() {
  const [agents, setAgents] = useState<SubAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.status}`)
      }
      const data = await response.json()

      // Transform gateway response to component format
      if (data.agents && Array.isArray(data.agents)) {
        const formattedAgents: SubAgent[] = data.agents.map((agent: any) => ({
          id: agent.id || agent.name?.toLowerCase() || 'unknown',
          emoji: agent.emoji || '🤖',
          name: agent.name || 'Unknown Agent',
          status: agent.status || 'idle',
          currentTask: agent.currentTask || agent.current_task || null,
          lastActivity: agent.lastActivity
            ? new Date(agent.lastActivity)
            : agent.last_activity
            ? new Date(agent.last_activity)
            : new Date(),
          completedTasks: agent.completedTasks || agent.completed_tasks || 0,
          logs: agent.logs || [],
        }))
        setAgents(formattedAgents)
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    // Poll every 10 seconds
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: SubAgent['status']) => {
    switch (status) {
      case 'working':
        return 'text-[var(--success)]'
      case 'paused':
        return 'text-[var(--warning)]'
      case 'error':
        return 'text-[var(--error)]'
      default:
        return 'text-[var(--foreground-muted)]'
    }
  }

  const getStatusBadge = (status: SubAgent['status']) => {
    switch (status) {
      case 'working':
        return 'badge-success'
      case 'paused':
        return 'badge-warning'
      case 'error':
        return 'badge-error'
      default:
        return 'badge-info'
    }
  }

  const toggleAgent = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    if (!agent) return

    const action = agent.status === 'working' ? 'pause' : 'resume'

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, agentId }),
      })

      if (response.ok) {
        // Optimistic update
        setAgents((prev) =>
          prev.map((a) => {
            if (a.id !== agentId) return a
            const newStatus = a.status === 'working' ? 'paused' : a.status === 'paused' ? 'working' : a.status
            return { ...a, status: newStatus }
          })
        )
        // Refresh from server
        setTimeout(fetchAgents, 1000)
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error)
    }
  }

  const stopAgent = async (agentId: string) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', agentId }),
      })

      if (response.ok) {
        // Optimistic update
        setAgents((prev) =>
          prev.map((a) => {
            if (a.id !== agentId) return a
            return { ...a, status: 'idle', currentTask: null }
          })
        )
        // Refresh from server
        setTimeout(fetchAgents, 1000)
      }
    } catch (error) {
      console.error('Failed to stop agent:', error)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agent Fleet</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            {agents.filter((a) => a.status === 'working').length} agents active
            {error && <span className="text-[var(--error)] ml-2">• {error}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAgents}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] font-medium hover:bg-[var(--accent-dim)] transition-all">
            <Play className="w-4 h-4" />
            <span className="text-sm">Spawn Agent</span>
          </button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && agents.length === 0 && (
          <div className="col-span-full text-center text-[var(--foreground-muted)] py-8">
            Loading agents...
          </div>
        )}
        {!isLoading && agents.length === 0 && (
          <div className="col-span-full text-center text-[var(--foreground-muted)] py-8">
            No agents found
          </div>
        )}
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`glass-panel p-4 cursor-pointer transition-all hover:glow-accent ${
              selectedAgent === agent.id ? 'ring-1 ring-[var(--accent)]' : ''
            }`}
            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{agent.emoji}</div>
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <span className={`badge ${getStatusBadge(agent.status)}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-[var(--background-tertiary)]"
              >
                <MoreVertical className="w-4 h-4 text-[var(--foreground-muted)]" />
              </button>
            </div>

            {agent.currentTask && (
              <div className="mb-3 p-2 rounded-lg bg-[var(--background-secondary)]">
                <div className="text-xs text-[var(--foreground-muted)] mb-1">Current Task</div>
                <div className="text-sm text-[var(--accent)]">{agent.currentTask}</div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(agent.lastActivity)}
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {agent.completedTasks} tasks
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleAgent(agent.id)
                }}
                disabled={agent.status === 'idle'}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] disabled:opacity-50 transition-all"
              >
                {agent.status === 'working' ? (
                  <>
                    <Pause className="w-3 h-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Resume
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  stopAgent(agent.id)
                }}
                disabled={agent.status === 'idle'}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs bg-[var(--background-secondary)] hover:bg-[var(--error)] hover:text-white disabled:opacity-50 transition-all"
              >
                <Square className="w-3 h-3" /> Stop
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Agent Logs */}
      {selectedAgent && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-medium mb-3">
            {agents.find((a) => a.id === selectedAgent)?.emoji}{' '}
            {agents.find((a) => a.id === selectedAgent)?.name} Logs
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto terminal">
            {agents
              .find((a) => a.id === selectedAgent)
              ?.logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm p-2 rounded bg-[var(--background-secondary)]"
                >
                  <span className="text-[var(--foreground-muted)] text-xs whitespace-nowrap">
                    {log.time.toLocaleTimeString()}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
