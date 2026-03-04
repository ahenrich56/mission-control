'use client'

import { useState } from 'react'
import { Play, Pause, RefreshCw, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'error'
  lastRun?: Date
  nextRun?: Date
  executions: number
  successRate: number
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Signal Hunter',
    description: 'Scans markets for trading signals',
    status: 'active',
    lastRun: new Date(Date.now() - 300000),
    nextRun: new Date(Date.now() + 600000),
    executions: 2456,
    successRate: 98.5,
  },
  {
    id: '2',
    name: 'Content Pipeline',
    description: 'Generates and posts social content',
    status: 'active',
    lastRun: new Date(Date.now() - 7200000),
    nextRun: new Date(Date.now() + 14400000),
    executions: 156,
    successRate: 95.2,
  },
  {
    id: '3',
    name: 'Health Monitor',
    description: 'Monitors system health and alerts',
    status: 'active',
    lastRun: new Date(Date.now() - 60000),
    nextRun: new Date(Date.now() + 60000),
    executions: 8640,
    successRate: 100,
  },
  {
    id: '4',
    name: 'Video Renderer',
    description: 'Renders Remotion video sequences',
    status: 'inactive',
    lastRun: new Date(Date.now() - 86400000),
    executions: 24,
    successRate: 87.5,
  },
]

export function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchWorkflows = async () => {
    setIsRefreshing(true)
    try {
      // In production, fetch from n8n API
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((workflow) => {
        if (workflow.id !== workflowId) return workflow
        return {
          ...workflow,
          status: workflow.status === 'active' ? 'inactive' : 'active',
        }
      })
    )
  }

  const runWorkflow = async (workflowId: string) => {
    // In production, trigger n8n workflow
    setWorkflows((prev) =>
      prev.map((workflow) => {
        if (workflow.id !== workflowId) return workflow
        return {
          ...workflow,
          lastRun: new Date(),
          executions: workflow.executions + 1,
        }
      })
    )
  }

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-[var(--success)]" />
      case 'error':
        return <XCircle className="w-4 h-4 text-[var(--error)]" />
      default:
        return <Pause className="w-4 h-4 text-[var(--foreground-muted)]" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const formatTimeUntil = (date: Date) => {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000)
    if (seconds < 0) return 'now'
    if (seconds < 60) return `in ${seconds}s`
    if (seconds < 3600) return `in ${Math.floor(seconds / 60)}m`
    return `in ${Math.floor(seconds / 3600)}h`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">n8n Workflows</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            {workflows.filter((w) => w.status === 'active').length} active workflows
          </p>
        </div>
        <button
          onClick={fetchWorkflows}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="glass-panel p-4 hover:glow-accent transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(workflow.status)}
                <div>
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {workflow.description}
                  </div>
                </div>
              </div>
              <span
                className={`badge ${
                  workflow.status === 'active'
                    ? 'badge-success'
                    : workflow.status === 'error'
                    ? 'badge-error'
                    : 'badge-warning'
                }`}
              >
                {workflow.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-[var(--foreground-muted)]">Last Run</div>
                <div className="text-sm">
                  {workflow.lastRun ? formatTimeAgo(workflow.lastRun) : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground-muted)]">Next Run</div>
                <div className="text-sm">
                  {workflow.nextRun ? formatTimeUntil(workflow.nextRun) : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground-muted)]">Executions</div>
                <div className="text-sm text-[var(--accent)]">
                  {workflow.executions.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground-muted)]">Success Rate</div>
                <div
                  className={`text-sm ${
                    workflow.successRate >= 90
                      ? 'text-[var(--success)]'
                      : workflow.successRate >= 70
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--error)]'
                  }`}
                >
                  {workflow.successRate}%
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => runWorkflow(workflow.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] text-sm font-medium hover:bg-[var(--accent-dim)] transition-all"
              >
                <Play className="w-3 h-3" /> Run Now
              </button>
              <button
                onClick={() => toggleWorkflow(workflow.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  workflow.status === 'active'
                    ? 'bg-[var(--background-secondary)] hover:bg-[var(--warning)] hover:text-white'
                    : 'bg-[var(--background-secondary)] hover:bg-[var(--success)] hover:text-white'
                }`}
              >
                {workflow.status === 'active' ? (
                  <>
                    <Pause className="w-3 h-3" /> Deactivate
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
