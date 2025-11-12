import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoredEvent {
  id: string
  name: string
  created_at: number
  times: string[]
  timezone: string
}

interface EventsStore {
  events: StoredEvent[]

  addEvent: (event: StoredEvent) => void
  removeEvent: (id: string) => void
  clearEvents: () => void
  updateEvent: (id: string, updates: Partial<StoredEvent>) => void
}

export const useEventsStore = create<EventsStore>()(persist(
  (set) => ({
    events: [],

    addEvent: (event) => set((state) => ({
      events: [
        { ...state.events.find(e => e.id === event.id), ...event },
        ...state.events.filter(e => e.id !== event.id)
      ],
    })),

    removeEvent: (id) => set((state) => ({
      events: state.events.filter(e => e.id !== id),
    })),

    clearEvents: () => set({ events: [] }),

    updateEvent: (id, updates) => set((state) => ({
      events: state.events.map(e => 
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  }),
  {
    name: 'happycal-events',
    version: 1,
  },
))

