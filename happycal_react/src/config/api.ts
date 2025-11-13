import { z } from 'zod'

// Use the crab fit API - can be overridden with environment variable
// In development, use proxy to avoid CORS issues
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = new URL(import.meta.env.VITE_API_URL);
    // Ensure trailing slash for proper path appending
    if (!url.pathname.endsWith('/')) {
      url.pathname += '/';
    }
    return url;
  }
  // In development, use proxy to avoid CORS
  // Check if we're in dev mode (Vite sets this)
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  if (isDev) {
    // Use proxy path that Vite will forward to api.crab.fit
    // Ensure trailing slash for proper path appending
    return new URL('/api/', window.location.origin);
  }
  // In production, use direct API
  return new URL('https://api.crab.fit/');
};

const API_BASE = getApiBase();
console.log('API_BASE:', API_BASE.toString(), 'Mode:', import.meta.env.MODE);

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

// Get auth token from localStorage (since authStore uses persist middleware)
const getAuthToken = (): string | undefined => {
  try {
    const authStorage = localStorage.getItem('happycal-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.accessToken || undefined;
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

const get = async <S extends z.Schema>(url: string, schema: S, auth?: string): Promise<ReturnType<S['parse']>> => {
  const token = auth || getAuthToken();
  // Construct URL properly - if API_BASE has a path, append to it
  const urlPath = url.startsWith('/') ? url.slice(1) : url; // Remove leading slash
  const fullUrl = new URL(urlPath, API_BASE);
  console.log('API GET request:', fullUrl.toString(), 'API_BASE:', API_BASE.toString(), 'urlPath:', urlPath);
  
  const res = await fetch(fullUrl, {
    headers: {
      ...token && { Authorization: `Bearer ${token}` },
    },
  })
    .catch((err) => {
      console.error('Fetch error:', err);
      throw err;
    });
    
  if (!res?.ok) {
    console.error('API error response:', {
      status: res.status,
      statusText: res.statusText,
      url: fullUrl.toString(),
    });
    throw res;
  }
  
  // Check if response is JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Non-JSON response received:', text.substring(0, 200));
    throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
  }
  
  const data = await res.json();
  console.log('API response data:', data);
  return schema.parse(data);
}

const post = async <S extends z.Schema>(url: string, schema: S, input: unknown, auth?: string, method = 'POST'): Promise<ReturnType<S['parse']>> => {
  const token = auth || getAuthToken();
  // Construct URL properly - if API_BASE has a path, append to it
  const urlPath = url.startsWith('/') ? url.slice(1) : url; // Remove leading slash
  const fullUrl = new URL(urlPath, API_BASE);
  console.log('API POST request:', fullUrl.toString(), 'API_BASE:', API_BASE.toString(), 'Input:', input);
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...token && { Authorization: `Bearer ${token}` },
    },
    body: JSON.stringify(input),
  })
    .catch((err) => {
      console.error('POST fetch error:', err);
      throw err;
    });
    
  if (!res?.ok) {
    console.error('API POST error response:', {
      status: res.status,
      statusText: res.statusText,
      url: fullUrl.toString(),
    });
    throw res;
  }
  
  // Check if response is JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Non-JSON POST response received:', text.substring(0, 200));
    throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
  }
  
  const data = await res.json();
  console.log('API POST response data:', data);
  return schema.parse(data);
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

