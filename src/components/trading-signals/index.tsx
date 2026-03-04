'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Clock } from 'lucide-react'

interface Signal {
  id: string
  pair: string
  direction: 'long' | 'short'
  entry: number
  target: number
  stop: number
  timestamp: Date
  status: 'active' | 'hit_target' | 'stopped_out' | 'expired'
}

interface Position {
  pair: string
  direction: 'long' | 'short'
  entry: number
  current: number
  size: number
  pnl: number
  pnlPercent: number
}

const mockSignals: Signal[] = [
  {
    id: '1',
    pair: 'BTC/USDT',
    direction: 'long',
    entry: 45230,
    target: 47500,
    stop: 44000,
    timestamp: new Date(Date.now() - 1800000),
    status: 'active',
  },
  {
    id: '2',
    pair: 'ETH/USDT',
    direction: 'short',
    entry: 2450,
    target: 2300,
    stop: 2520,
    timestamp: new Date(Date.now() - 7200000),
    status: 'hit_target',
  },
]

const mockPositions: Position[] = [
  {
    pair: 'BTC/USDT',
    direction: 'long',
    entry: 45230,
    current: 45890,
    size: 0.5,
    pnl: 330,
    pnlPercent: 1.46,
  },
]

export function TradingSignals() {
  const [signals] = useState<Signal[]>(mockSignals)
  const [positions] = useState<Position[]>(mockPositions)

  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const isProfitable = totalPnl >= 0

  const getStatusBadge = (status: Signal['status']) => {
    switch (status) {
      case 'active':
        return 'badge-info'
      case 'hit_target':
        return 'badge-success'
      case 'stopped_out':
        return 'badge-error'
      default:
        return 'badge-warning'
    }
  }

  return (
    <div className="space-y-6">
      {/* P&L Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Total P&L</span>
          </div>
          <div
            className={`text-2xl font-bold ${
              isProfitable ? 'text-[var(--success)]' : 'text-[var(--error)]'
            }`}
          >
            {isProfitable ? '+' : ''}${totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Open Positions</span>
          </div>
          <div className="text-2xl font-bold text-[var(--accent)]">{positions.length}</div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--success)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-[var(--success)]">68%</div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Active Signals</span>
          </div>
          <div className="text-2xl font-bold text-[var(--accent)]">
            {signals.filter((s) => s.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-medium mb-4">Open Positions</h4>
        {positions.length > 0 ? (
          <div className="space-y-3">
            {positions.map((position) => (
              <div
                key={position.pair}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-secondary)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      position.direction === 'long'
                        ? 'bg-[rgba(0,255,136,0.15)]'
                        : 'bg-[rgba(255,68,68,0.15)]'
                    }`}
                  >
                    {position.direction === 'long' ? (
                      <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{position.pair}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">
                      Entry: ${position.entry.toLocaleString()} | Size: {position.size}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold ${
                      position.pnl >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                    }`}
                  >
                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                  </div>
                  <div
                    className={`text-xs ${
                      position.pnlPercent >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                    }`}
                  >
                    {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[var(--foreground-muted)] py-4">
            No open positions
          </div>
        )}
      </div>

      {/* Recent Signals */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-medium mb-4">Recent Signals</h4>
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-secondary)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    signal.direction === 'long'
                      ? 'bg-[rgba(0,255,136,0.15)]'
                      : 'bg-[rgba(255,68,68,0.15)]'
                  }`}
                >
                  {signal.direction === 'long' ? (
                    <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{signal.pair}</span>
                    <span
                      className={`text-xs font-medium ${
                        signal.direction === 'long' ? 'text-[var(--success)]' : 'text-[var(--error)]'
                      }`}
                    >
                      {signal.direction.toUpperCase()}
                    </span>
                    <span className={`badge ${getStatusBadge(signal.status)}`}>
                      {signal.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Entry: ${signal.entry.toLocaleString()} | Target: ${signal.target.toLocaleString()} | Stop: ${signal.stop.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">
                {signal.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
