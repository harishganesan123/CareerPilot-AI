
import apiClient from './client'

export interface UserSettings {
  full_name: string
  email: string
}

export interface UpdateUserSettings {
  full_name: string
}

/**
 * Fetch the currently authenticated user's profile.
 * Uses the existing GET /api/users/me endpoint.
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  const { data } = await apiClient.get('/users/me')

  return {
    full_name: data.full_name ?? data.name ?? '',
    email: data.email ?? '',
  }
}

/**
 * Update the currently authenticated user's profile.
 * Maps the frontend full_name field to the backend name field.
 */
export async function updateUserSettings(
  payload: UpdateUserSettings,
): Promise<UserSettings> {
  const { data } = await apiClient.patch('/users/me', {
    name: payload.full_name,
  })

  return {
    full_name: data.full_name ?? data.name ?? payload.full_name,
    email: data.email ?? '',
  }
}
