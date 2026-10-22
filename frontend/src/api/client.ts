import axios, { AxiosError } from 'axios'

// Base URL is read from Vite env at build time. Falls back to local dev backend.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const ACCESS_TOKEN_KEY = 'careerpilot_access_token'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT access token automatically when present.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * A normalized, user-friendly error shape. Every API call in this app
 * should catch AxiosError and translate it via `toApiError` so components
 * never have to inspect raw Axios/Python error shapes directly.
 */
export interface ApiError {
  status: number | null
  message: string
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ detail?: string | { msg: string }[] }>

    if (!err.response) {
      // Network error: request never reached the backend.
      return { status: null, message: 'Could not reach the server. Check your connection and try again.' }
    }

    const detail = err.response.data?.detail
    if (typeof detail === 'string') {
      return { status: err.response.status, message: detail }
    }
    if (Array.isArray(detail) && detail.length > 0) {
      // FastAPI/Pydantic validation error array.
      return { status: err.response.status, message: detail.map((d) => d.msg).join(' ') }
    }

    if (err.response.status >= 500) {
      return { status: err.response.status, message: 'Something went wrong on our end. Please try again shortly.' }
    }

    return { status: err.response.status, message: 'The request could not be completed.' }
  }

  return { status: null, message: 'An unexpected error occurred.' }
}

export default apiClient
