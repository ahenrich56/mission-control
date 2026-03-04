'use client'

import { useState } from 'react'
import {
  Terminal,
  Activity,
  Users,
  ListTodo,
  Radio,
  TrendingUp,
  Workflow,
  Settings,
  Menu,
} from 'lucide-react'
import { CommandCenter } from '@/components/command-center'
import { SystemStatus } from '@/components/system-status'
import { AgentFleet } from '@/components/agent-fleet'
import { TaskQueue } from '@/components/task-queue'
import { ObservationFeed } from '@/components/observation-feed'
import { TradingSignals } from '@/components/trading-signals'
import { Workflows } from '@/components/workflows'

type Tab = 'command' | 'status' | 'agents' | 'tasks' | 'feed' | 'trading' | 'workflows'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'command', label: 'Command', icon: <Terminal className="w-4 h-4" /> },
  { id: 'status', label: 'Status', icon: <Activity className="w-4 h-4" /> },
  { id: 'agents', label: 'Agents', icon: <Users className="w-4 h-4" /> },
  { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
  { id: 'feed', label: 'Feed', icon: <Radio className="w-4 h-4" /> },
  { id: 'trading', label: 'Trading', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'workflows', label: 'Workflows', icon: <Workflow className="w-4 h-4" /> },
]

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState<Tab>('command')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const renderContent = () => {
    switch (activeTab) {
      case 'command':
        return <CommandCenter />
      case 'status':
        return <SystemStatus />
      case 'agents':
        return <AgentFleet />
      case 'tasks':
        return <TaskQueue />
      case 'feed':
        return <ObservationFeed />
      case 'trading':
        return <TradingSignals />
      case 'workflows':
        return <Workflows />
      default:
        return <CommandCenter />
    }
  }

  return (
    <div className="flex h-screen bg-[var(--background)] grid-pattern">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } flex flex-col border-r border-[var(--border)] bg-[var(--background-secondary)] transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-lg">🦞</span>
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-[var(--accent)] glow-text">OpenClaw</h1>
              <p className="text-xs text-[var(--foreground-muted)]">Mission Control</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-glow)] text-[var(--accent)] glow-accent'
                  : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.icon}
              {sidebarOpen && <span className="text-sm">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="status-dot online" />
            {sidebarOpen && (
              <span className="text-xs text-[var(--foreground-muted)]">Connected</span>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="p-2 border-t border-[var(--border)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] transition-all"
          >
            <Menu className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Toggle</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {tabs.find((t) => t.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <span className="badge badge-success">LIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-[var(--foreground-muted)]">
              Model: <span className="text-[var(--accent)]">Kimi K2 Thinking</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
              <Settings className="w-4 h-4 text-[var(--foreground-muted)]" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
      </main>
    </div>
  )
}
