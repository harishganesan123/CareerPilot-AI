import axios from 'axios'
import apiClient, { toApiError } from './client'

export type RecommendationSource = 'ai' | 'rule_based'

export interface StudyRecommendation {
  skill_name: string
  priority: 'Low' | 'Medium' | 'High'
  estimated_minutes: number
  reason: string
  suggested_activity: string
  // Present on AI-generated recommendations only.
  order?: number
  prerequisites?: string[]
  expected_outcome?: string
  already_planned?: boolean
}

export interface StudyRecommendationResult {
  role_name: string
  readiness_score: number
  readiness_level: string
  missing_count: number
  recommendations: StudyRecommendation[]
  method_note: string
  /** Where the suggestions came from. Older backends omit it: treat as rule-based. */
  source?: RecommendationSource
  model?: string | null
}

/** Rule-based suggestions. No AI call is made. */
export async function fetchStudyRecommendations(
  roleName: string,
): Promise<StudyRecommendationResult> {
  const { data } = await apiClient.get<StudyRecommendationResult>(
    '/study-recommendations',
    { params: { role_name: roleName } },
  )

  return data
}

/**
 * AI-generated suggestions, produced by the backend through the shared AI
 * service. The request carries only the role name; the server looks up the
 * student's skills and tasks itself.
 */
export async function generateAIStudyRecommendations(
  roleName: string,
): Promise<StudyRecommendationResult> {
  // The backend gives the model up to ~30s; allow the browser a little longer.
  const { data } = await apiClient.post<StudyRecommendationResult>(
    '/study-recommendations/ai',
    { role_name: roleName },
    { timeout: 45_000 },
  )
  return data
}

/** User-facing message for a failed recommendation request. */
export function recommendationErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response && error.code === 'ECONNABORTED') {
    return 'The AI service took too long to respond. Please try again.'
  }
  return toApiError(error).message
}
