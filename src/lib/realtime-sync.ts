import { useMissionControlStore } from './store'
import type { Task, SubAgent, Observation } from './store'

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

interface MetricsEvent {
  cpu: number
  memory: number
  uptime: number
  requests: number
}

class RealtimeSyncService {
  private ws: WebSocket | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000

  constructor(private wsUrl: string) {}

  connect() {
    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('[RealtimeSync] Connected to OpenClaw bridge')
        this.reconnectAttempts = 0
        useMissionControlStore.getState().setConnectionStatus(true)
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
        console.log('[RealtimeSync] Disconnected from OpenClaw bridge')
        useMissionControlStore.getState().setConnectionStatus(false)
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
    console.log(
      `[RealtimeSync] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private handleEvent(event: OpenClawBridgeEvent) {
    const store = useMissionControlStore.getState()

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
      case 'metrics':
        this.handleMetricsEvent(event, store)
        break
      case 'connection':
        store.setConnectionStatus(event.data as boolean)
        break
      default:
        console.warn('[RealtimeSync] Unknown event type:', event.type)
    }
  }

  private handleTaskEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControlStore.getState>
  ) {
    const taskData = event.data as TaskEvent

    switch (event.action) {
      case 'create': {
        const task: Task = {
          ...taskData,
          created_at: new Date(taskData.created_at),
          finished_at: taskData.finished_at ? new Date(taskData.finished_at) : undefined,
        }
        store.addTask(task)
        break
      }
      case 'update': {
        const updates: Partial<Task> = {
          ...taskData,
          created_at: taskData.created_at ? new Date(taskData.created_at) : undefined,
          finished_at: taskData.finished_at ? new Date(taskData.finished_at) : undefined,
        }
        store.updateTask(taskData.id, updates)
        break
      }
      case 'delete':
        store.removeTask(taskData.id)
        break
    }
  }

  private handleAgentEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControlStore.getState>
  ) {
    const agentData = event.data as AgentEvent

    switch (event.action) {
      case 'create': {
        const agent: SubAgent = {
          ...agentData,
          lastActivity: new Date(agentData.lastActivity),
          logs: [],
        }
        store.addAgent(agent)
        break
      }
      case 'update': {
        const updates: Partial<SubAgent> = {
          ...agentData,
          lastActivity: agentData.lastActivity ? new Date(agentData.lastActivity) : undefined,
        }
        store.updateAgent(agentData.id, updates)
        break
      }
      case 'delete':
        store.removeAgent(agentData.id)
        break
    }
  }

  private handleObservationEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControlStore.getState>
  ) {
    if (event.action !== 'create') return

    const obsData = event.data as ObservationEvent
    const observation: Observation = {
      id: Date.now(),
      type: obsData.type,
      title: obsData.title,
      subtitle: obsData.subtitle,
      timestamp: new Date(event.timestamp),
      agent: obsData.agent,
      emoji: obsData.emoji,
    }

    store.addObservation(observation)
  }

  private handleMetricsEvent(
    event: OpenClawBridgeEvent,
    store: ReturnType<typeof useMissionControlStore.getState>
  ) {
    const metricsData = event.data as MetricsEvent
    store.updateMetrics(metricsData)
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

    useMissionControlStore.getState().setConnectionStatus(false)
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
