import { z } from 'zod'

// Use the crab fit API - can be overridden with environment variable
const API_BASE = new URL(import.meta.env.VITE_API_URL || 'https://api.crab.fit')

export const EventInput = z.object({
  name: z.string().optional(),
  times: z.string().array(),
  timezone: z.string(),
})
export type EventInput = z.infer<typeof EventInput>

export const EventResponse = z.object({
  id: z.string(),
  name: z.string(),
  times: z.string().array(),
  timezone: z.string(),
  created_at: z.number(),
})
export type EventResponse = z.infer<typeof EventResponse>

export const PersonInput = z.object({
  availability: z.string().array(),
})
export type PersonInput = z.infer<typeof PersonInput>

export const PersonResponse = z.object({
  name: z.string(),
  availability: z.string().array(),
  created_at: z.number(),
})
export type PersonResponse = z.infer<typeof PersonResponse>

const get = async <S extends z.Schema>(url: string, schema: S, auth?: string): Promise<ReturnType<S['parse']>> => {
  const res = await fetch(new URL(url, API_BASE), {
    headers: {
      ...auth && { Authorization: `Bearer ${auth}` },
    },
  })
    .catch(console.warn)
  if (!res?.ok) throw res
  return schema.parse(await res.json())
}

const post = async <S extends z.Schema>(url: string, schema: S, input: unknown, auth?: string, method = 'POST'): Promise<ReturnType<S['parse']>> => {
  const res = await fetch(new URL(url, API_BASE), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...auth && { Authorization: `Bearer ${auth}` },
    },
    body: JSON.stringify(input),
  })
    .catch(console.warn)
  if (!res?.ok) throw res
  return schema.parse(await res.json())
}

// Get
export const getEvent = (eventId: string) => get(`/event/${eventId}`, EventResponse)
export const getPeople = (eventId: string) => get(`/event/${eventId}/people`, PersonResponse.array())
export const getPerson = (eventId: string, personName: string, password?: string) => 
  get(`/event/${eventId}/people/${personName}`, PersonResponse, password && btoa(password))

// Post
export const createEvent = (input: EventInput) => post('/event', EventResponse, EventInput.parse(input))
export const updatePerson = (eventId: string, personName: string, input: PersonInput, password?: string) => 
  post(`/event/${eventId}/people/${personName}`, PersonResponse, PersonInput.parse(input), password && btoa(password), 'PATCH')

