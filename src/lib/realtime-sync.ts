import { useMissionControl } from './store'
import type { Task, Agent, Observation } from './store'

interface OpenClawBridgeEvent {
  type: 'task' | 'agent' | 'observation' | 'metrics' | 'connection'
  action: 'create' | 'update' | 'delete' | 'status'
  data: unknown
  timestamp: string
}

interface TaskEvent {
  id: string
  type: string
  payload: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  created_at: string
  finished_at?: string
}

interface AgentEvent {
  id: string
  emoji: string
  name: string
  status: 'idle' | 'working' | 'paused' | 'error'
  currentTask: string | null
  lastActivity: string
  completedTasks: number
}

interface ObservationEvent {
  type: 'decision' | 'bugfix' | 'feature' | 'refactor' | 'discovery' | 'change'
  title: string
  subtitle?: string
  agent?: string
  emoji?: string
}

class RealtimeSyncService {
  private ws: WebSocket | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000

  constructor(private wsUrl: string) {}

  connect() {
    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('[RealtimeSync] Connected to OpenClaw gateway')
        this.reconnectAttempts = 0
        useMissionControl.getState().setConnected(true)
      }

      this.ws.onmessage = (event) => {
        try {
          const bridgeEvent: OpenClawBridgeEvent = JSON.parse(event.data)
          this.handleEvent(bridgeEvent)
        } catch (error) {
          console.error('[RealtimeSync] Failed to parse message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[RealtimeSync] WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('[RealtimeSync] Disconnected from OpenClaw gateway')
        useMissionControl.getState().setConnected(false)
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('[RealtimeSync] Connection error:', error)
      this.attemptReconnect()
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RealtimeSync] Max reconnection attempts reached')
      return
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    )

    this.reconnectAttempts++
    console.log(`[RealtimeSync] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private handleEvent(event: OpenClawBridgeEvent) {
    const store = useMissionControl.getState()

    switch (event.type) {
      case 'task':
        this.handleTaskEvent(event, store)
        break
      case 'agent':
        this.handleAgentEvent(event, store)
        break
      case 'observation':
        this.handleObservationEvent(event, store)
        break
      case 'connection':
        store.setConnected(event.data as boolean)
        break
      default:
        console.warn('[RealtimeSync] Unknown event type:', event.type)
    }
  }

  private handleTaskEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControl.getState>
  ) {
    const taskData = event.data as TaskEvent
    const statusMap: Record<string, Task['status']> = {
      pending: 'pending',
      running: 'in_progress',
      completed: 'completed',
      failed: 'failed',
    }

    switch (event.action) {
      case 'create':
        store.addTask({
          name: taskData.id,
          status: statusMap[taskData.status] || 'pending',
          description: taskData.type,
          result: taskData.result,
        })
        break
      case 'update':
        store.updateTask(taskData.id, {
          status: statusMap[taskData.status] || 'pending',
          result: taskData.result,
        })
        break
      case 'delete':
        store.removeTask(taskData.id)
        break
    }
  }

  private handleAgentEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControl.getState>
  ) {
    const agentData = event.data as AgentEvent
    const statusMap: Record<string, Agent['status']> = {
      idle: 'idle',
      working: 'busy',
      paused: 'idle',
      error: 'offline',
    }

    switch (event.action) {
      case 'create':
        store.addAgent({
          id: agentData.id,
          name: agentData.name,
          status: statusMap[agentData.status] || 'idle',
          currentTask: agentData.currentTask || undefined,
          lastSeen: agentData.lastActivity,
        })
        break
      case 'update':
        store.updateAgent(agentData.id, {
          status: statusMap[agentData.status] || 'idle',
          currentTask: agentData.currentTask || undefined,
          lastSeen: agentData.lastActivity,
        })
        break
      case 'delete':
        store.removeAgent(agentData.id)
        break
    }
  }

  private handleObservationEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControl.getState>
  ) {
    if (event.action !== 'create') return

    const obsData = event.data as ObservationEvent
    const typeMap: Record<string, Observation['type']> = {
      decision: 'system',
      bugfix: 'task',
      feature: 'task',
      refactor: 'task',
      discovery: 'system',
      change: 'agent',
    }

    store.addObservation({
      source: obsData.agent || 'system',
      type: typeMap[obsData.type] || 'system',
      message: obsData.subtitle ? `${obsData.title}: ${obsData.subtitle}` : obsData.title,
    })
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    useMissionControl.getState().setConnected(false)
  }

  send(message: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('[RealtimeSync] Cannot send message: WebSocket not connected')
    }
  }
}

// Singleton instance
let syncService: RealtimeSyncService | null = null

export function initRealtimeSync(wsUrl: string = `${process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_WS || 'ws://31.97.128.136:18789'}?token=${process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || ''}`) {
  if (syncService) {
    console.warn('[RealtimeSync] Service already initialized')
    return syncService
  }

  syncService = new RealtimeSyncService(wsUrl)
  syncService.connect()
  return syncService
}

export function getRealtimeSyncService() {
  if (!syncService) {
    throw new Error('[RealtimeSync] Service not initialized. Call initRealtimeSync() first')
  }
  return syncService
}

export function disconnectRealtimeSync() {
  if (syncService) {
    syncService.disconnect()
    syncService = null
  }
}
