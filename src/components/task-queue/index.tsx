'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Task {
  id: string
  type: string
  payload: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  created_at: Date
  finished_at?: Date
}

export function TaskQueue() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all')

  const fetchTasks = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/agent/task', {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'dev-key-mission-control-2024',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.tasks) {
          const formattedTasks = data.data.tasks.map((task: any) => ({
            id: task.id,
            type: task.type,
            payload: task.payload,
            status: task.status,
            result: task.result,
            created_at: new Date(task.createdAt || task.created_at),
            finished_at: task.finishedAt || task.finished_at ? new Date(task.finishedAt || task.finished_at) : undefined,
          }))
          setTasks(formattedTasks)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-[var(--success)]" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-[var(--error)]" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-[var(--info)] animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-[var(--foreground-muted)]" />
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'failed':
        return 'badge-error'
      case 'running':
        return 'badge-info'
      default:
        return 'badge-warning'
    }
  }

  const filteredTasks = tasks.filter((task) => filter === 'all' || task.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Queue</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            {tasks.filter((t) => t.status === 'running').length} running,{' '}
            {tasks.filter((t) => t.status === 'pending').length} pending
          </p>
        </div>
        <button
          onClick={fetchTasks}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'running', 'completed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === status
                ? 'bg-[var(--accent)] text-[var(--background)]'
                : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Task Table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-4 text-xs font-medium text-[var(--foreground-muted)]">
                STATUS
              </th>
              <th className="text-left p-4 text-xs font-medium text-[var(--foreground-muted)]">
                TYPE
              </th>
              <th className="text-left p-4 text-xs font-medium text-[var(--foreground-muted)]">
                PAYLOAD
              </th>
              <th className="text-left p-4 text-xs font-medium text-[var(--foreground-muted)]">
                RESULT
              </th>
              <th className="text-left p-4 text-xs font-medium text-[var(--foreground-muted)]">
                CREATED
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--background-secondary)] transition-all"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className={`badge ${getStatusBadge(task.status)}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm text-[var(--accent)]">{task.type}</span>
                </td>
                <td className="p-4">
                  <code className="text-xs bg-[var(--background-tertiary)] px-2 py-1 rounded">
                    {JSON.stringify(task.payload).slice(0, 50)}...
                  </code>
                </td>
                <td className="p-4">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {task.result || '-'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {task.created_at.toLocaleTimeString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-[var(--foreground-muted)]">
            No tasks found
          </div>
        )}
      </div>
    </div>
  )
}
