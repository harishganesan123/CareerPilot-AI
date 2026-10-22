import apiClient from './client'

export interface StudyRecommendation {
  skill_name: string
  priority: 'Low' | 'Medium' | 'High'
  estimated_minutes: number
  reason: string
  suggested_activity: string
}

export interface StudyRecommendationResult {
  role_name: string
  readiness_score: number
  readiness_level: string
  missing_count: number
  recommendations: StudyRecommendation[]
  method_note: string
}

export async function fetchStudyRecommendations(
  roleName: string,
): Promise<StudyRecommendationResult> {
  const { data } = await apiClient.get<StudyRecommendationResult>(
    '/study-recommendations',
    { params: { role_name: roleName } },
  )

  return data
}
