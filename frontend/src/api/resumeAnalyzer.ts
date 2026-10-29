import apiClient from './client'

export interface ResumeFeedback {
  summary: string
  strengths: string[]
  improvements: string[]
  skills_found: string[]
  missing_or_unclear_skills: string[]
  bullet_rewrites: string[]
  ats_tips: string[]
}

export interface ResumeAnalysis {
  filename: string
  target_role: string
  ats_score: number
  score_breakdown: Record<string, number>
  detected_sections: string[]
  feedback: ResumeFeedback
  score_note: string
  source: 'ai_generated' | 'rule_based' | string
}

export async function fetchResumeRoles(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/resume-analyzer/roles')
  return data
}

export async function analyzeResume(
  file: File,
  targetRole: string,
): Promise<ResumeAnalysis> {
  const form = new FormData()
  form.append('file', file)
  form.append('target_role', targetRole)
  const { data } = await apiClient.post<ResumeAnalysis>(
    '/resume-analyzer/analyze',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}
