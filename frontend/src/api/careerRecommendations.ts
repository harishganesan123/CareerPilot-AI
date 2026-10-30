import apiClient from './client'

export interface CareerRecommendationSkill {
  skill_name: string
  student_skill_name: string
  proficiency: string
  proficiency_percent: number
}

export interface CareerRecommendation {
  role_name: string
  description: string
  readiness_score: number
  readiness_level: 'High' | 'Moderate' | 'Developing' | string
  matched_count: number
  missing_count: number
  total_required_skills: number
  matched_skills: CareerRecommendationSkill[]
  missing_skills: string[]
  recommended_next_skills: string[]
  score_note: string
}

export interface CareerRecommendationsResponse {
  recommendations: CareerRecommendation[]
  note: string
}

export async function fetchCareerRecommendations(
  limit = 3,
): Promise<CareerRecommendationsResponse> {
  const { data } = await apiClient.get<CareerRecommendationsResponse>(
    '/career-recommendations',
    { params: { limit } },
  )
  return data
}
