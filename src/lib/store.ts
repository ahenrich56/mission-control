import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Types
export interface Task {
  id: string
  type: string
  payload: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  created_at: Date
  finished_at?: Date
}

export interface SubAgent {
  id: string
  emoji: string
  name: string
  status: 'idle' | 'working' | 'paused' | 'error'
  currentTask: string | null
  lastActivity: Date
  completedTasks: number
  logs: { time: Date; message: string }[]
}

export interface Observation {
  id: number
  type: 'decision' | 'bugfix' | 'feature' | 'refactor' | 'discovery' | 'change'
  title: string
  subtitle?: string
  timestamp: Date
  agent?: string
  emoji?: string
}

export interface SystemMetrics {
  cpu: number
  memory: number
  uptime: number
  requests: number
}

// Store State Interface
interface MissionControlState {
  // Tasks
  tasks: Task[]
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  clearCompletedTasks: () => void

  // Agents
  agents: SubAgent[]
  addAgent: (agent: SubAgent) => void
  updateAgent: (id: string, updates: Partial<SubAgent>) => void
  removeAgent: (id: string) => void
  addAgentLog: (agentId: string, log: { time: Date; message: string }) => void

  // Observations
  observations: Observation[]
  addObservation: (observation: Observation) => void
  clearObservations: () => void

  // System Metrics
  metrics: SystemMetrics
  updateMetrics: (metrics: Partial<SystemMetrics>) => void

  // Connection Status
  isConnected: boolean
  setConnectionStatus: (status: boolean) => void

  // Reset all state
  resetStore: () => void
}

// Initial state
const initialState = {
  tasks: [],
  agents: [],
  observations: [],
  metrics: {
    cpu: 0,
    memory: 0,
    uptime: 0,
    requests: 0,
  },
  isConnected: false,
}

// Create store with devtools middleware for debugging
export const useMissionControlStore = create<MissionControlState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Task actions
      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        }), false, 'addTask'),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }), false, 'updateTask'),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }), false, 'removeTask'),

      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.status !== 'completed'),
        }), false, 'clearCompletedTasks'),

      // Agent actions
      addAgent: (agent) =>
        set((state) => ({
          agents: [...state.agents, agent],
        }), false, 'addAgent'),

      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        }), false, 'updateAgent'),

      removeAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
        }), false, 'removeAgent'),

      addAgentLog: (agentId, log) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId
              ? { ...agent, logs: [log, ...agent.logs.slice(0, 99)] }
              : agent
          ),
        }), false, 'addAgentLog'),

      // Observation actions
      addObservation: (observation) =>
        set((state) => ({
          observations: [observation, ...state.observations.slice(0, 99)],
        }), false, 'addObservation'),

      clearObservations: () =>
        set({ observations: [] }, false, 'clearObservations'),

      // Metrics actions
      updateMetrics: (metrics) =>
        set((state) => ({
          metrics: { ...state.metrics, ...metrics },
        }), false, 'updateMetrics'),

      // Connection status
      setConnectionStatus: (status) =>
        set({ isConnected: status }, false, 'setConnectionStatus'),

      // Reset store
      resetStore: () =>
        set(initialState, false, 'resetStore'),
    }),
    { name: 'MissionControl' }
  )
)

// Selectors for optimized renders
export const selectTasks = (state: MissionControlState) => state.tasks
export const selectAgents = (state: MissionControlState) => state.agents
export const selectObservations = (state: MissionControlState) => state.observations
export const selectMetrics = (state: MissionControlState) => state.metrics
export const selectConnectionStatus = (state: MissionControlState) => state.isConnected

// Filtered selectors
export const selectTasksByStatus = (status: Task['status']) => (state: MissionControlState) =>
  state.tasks.filter((task) => task.status === status)

export const selectActiveAgents = (state: MissionControlState) =>
  state.agents.filter((agent) => agent.status === 'working')

export const selectAgentById = (id: string) => (state: MissionControlState) =>
  state.agents.find((agent) => agent.id === id)
