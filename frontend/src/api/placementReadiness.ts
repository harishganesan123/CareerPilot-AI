import apiClient from './client'

export interface ReadinessFactor {
  name: string
  score: number
  weight: number
  status: string
  details: string
}

export interface PlacementReadinessResponse {
  overall_score: number
  readiness_level: string
  target_role: string | null
  factors: ReadinessFactor[]
  strengths: string[]
  improvement_areas: string[]
  recommended_actions: string[]
  disclaimer: string
}

export async function fetchPlacementReadiness(
  targetRole?: string,
): Promise<PlacementReadinessResponse> {
  const response = await apiClient.get<PlacementReadinessResponse>(
    '/placement-readiness',
    { params: targetRole ? { target_role: targetRole } : undefined },
  )
  return response.data
}
