import apiClient from './client'
import type { UserProfile, UserUpdatePayload } from '../types/user'

export async function fetchProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me')
  return data
}

export async function updateProfile(payload: UserUpdatePayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>('/users/me', payload)
  return data
}
