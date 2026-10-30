import apiClient from './client'

export interface CareerRoleOption {
  role_name: string
  description: string
  required_skills: string[]
}

export interface MatchedSkill {
  skill_name: string
  student_skill_name: string
  proficiency: string
  proficiency_percent: number
}

export interface SkillGapResult {
  role_name: string
  description: string
  readiness_score: number
  readiness_level: string
  matched_count: number
  missing_count: number
  total_required_skills: number
  matched_skills: MatchedSkill[]
  missing_skills: string[]
  recommended_next_skills: string[]
  score_note: string
}

export async function fetchCareerRoles(): Promise<CareerRoleOption[]> {
  const { data } = await apiClient.get<CareerRoleOption[]>('/skill-gap/roles')
  return data
}

export async function analyzeSkillGap(
  roleName: string,
): Promise<SkillGapResult> {
  const { data } = await apiClient.post<SkillGapResult>(
    '/skill-gap/analyze',
    { role_name: roleName },
  )
  return data
}
