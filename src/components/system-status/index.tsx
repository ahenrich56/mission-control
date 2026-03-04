'use client'

import { useState, useEffect } from 'react'
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  Activity,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

interface SystemHealth {
  gateway: { status: 'online' | 'offline' | 'warning'; latency: number }
  n8n: { status: 'online' | 'offline' | 'warning'; workflows: number }
  database: { status: 'online' | 'offline' | 'warning'; size: string }
  memory: { status: 'online' | 'offline' | 'warning'; usage: string }
  currentModel: string
  uptime: string
  lastHealthCheck: Date
}

const mockHealth: SystemHealth = {
  gateway: { status: 'online', latency: 45 },
  n8n: { status: 'online', workflows: 12 },
  database: { status: 'online', size: '24.5 MB' },
  memory: { status: 'online', usage: '156 MB' },
  currentModel: 'moonshotai/kimi-k2-thinking',
  uptime: '3d 14h 22m',
  lastHealthCheck: new Date(),
}

export function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth>(mockHealth)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchHealth = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/agent/status')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch health:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const StatusIndicator = ({
    status,
  }: {
    status: 'online' | 'offline' | 'warning'
  }) => (
    <span
      className={`status-dot ${
        status === 'online' ? 'online' : status === 'warning' ? 'warning' : 'offline'
      }`}
    />
  )

  const StatusCard = ({
    icon: Icon,
    title,
    status,
    value,
    subtitle,
  }: {
    icon: React.ElementType
    title: string
    status: 'online' | 'offline' | 'warning'
    value: string | number
    subtitle?: string
  }) => (
    <div className="glass-panel p-4 hover:glow-accent transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--background-tertiary)]">
            <Icon className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <StatusIndicator status={status} />
      </div>
      <div className="text-2xl font-bold text-[var(--accent)] glow-text">{value}</div>
      {subtitle && (
        <div className="text-xs text-[var(--foreground-muted)] mt-1">{subtitle}</div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Health</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Last checked: {health.lastHealthCheck.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={Server}
          title="Gateway"
          status={health.gateway.status}
          value={`${health.gateway.latency}ms`}
          subtitle="Port 18789"
        />
        <StatusCard
          icon={Activity}
          title="n8n Engine"
          status={health.n8n.status}
          value={health.n8n.workflows}
          subtitle="Active workflows"
        />
        <StatusCard
          icon={Database}
          title="Memory DB"
          status={health.database.status}
          value={health.database.size}
          subtitle="SQLite + FTS5"
        />
        <StatusCard
          icon={HardDrive}
          title="Memory Usage"
          status={health.memory.status}
          value={health.memory.usage}
          subtitle="Session context"
        />
      </div>

      {/* Model & Uptime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-medium">Active Model</span>
          </div>
          <div className="text-lg font-mono text-[var(--accent)]">{health.currentModel}</div>
          <div className="mt-2 flex gap-2">
            <span className="badge badge-success">Primary</span>
            <span className="badge badge-info">NVIDIA NIM</span>
          </div>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-medium">System Uptime</span>
          </div>
          <div className="text-lg font-mono text-[var(--accent)]">{health.uptime}</div>
          <div className="mt-2">
            <span className="badge badge-success">Stable</span>
          </div>
        </div>
      </div>

      {/* Model Fallback Chain */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-medium mb-4">Model Fallback Chain</h4>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {[
            { name: 'Kimi K2 Thinking', status: 'active' },
            { name: 'MiniMax M2.1', status: 'standby' },
            { name: 'Gemini 2.0 Flash', status: 'standby' },
            { name: 'Gemini 3 Pro', status: 'standby' },
          ].map((model, index) => (
            <div key={model.name} className="flex items-center gap-2">
              <div
                className={`px-3 py-2 rounded-lg border ${
                  model.status === 'active'
                    ? 'border-[var(--accent)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border)] bg-[var(--background-secondary)]'
                }`}
              >
                <span
                  className={`text-sm ${
                    model.status === 'active'
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--foreground-muted)]'
                  }`}
                >
                  {model.name}
                </span>
              </div>
              {index < 3 && (
                <span className="text-[var(--foreground-muted)]">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
          Recent Alerts
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background-secondary)]">
            <span className="text-sm text-[var(--foreground-muted)]">No recent alerts</span>
            <span className="badge badge-success">All Clear</span>
          </div>
        </div>
      </div>
    </div>
  )
}
