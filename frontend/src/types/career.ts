import type { UserPublic } from './user'

export type SkillCategory =
  | 'Programming'
  | 'AI/ML'
  | 'Data'
  | 'Web Development'
  | 'Database'
  | 'Cloud'
  | 'Tools'
  | 'Soft Skills'
  | 'Other'

export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export const SKILL_CATEGORIES: SkillCategory[] = [
  'Programming',
  'AI/ML',
  'Data',
  'Web Development',
  'Database',
  'Cloud',
  'Tools',
  'Soft Skills',
  'Other',
]

export const PROFICIENCY_LEVELS: Proficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
]

export interface Skill {
  id: number
  skill_name: string
  category: SkillCategory
  proficiency: Proficiency
  proficiency_percent: number
  created_at: string
  updated_at: string
}

export interface SkillPayload {
  skill_name: string
  category: SkillCategory
  proficiency: Proficiency
}

export type ProjectType =
  | 'Academic'
  | 'Personal'
  | 'Internship'
  | 'Hackathon'
  | 'Research'

export const PROJECT_TYPES: ProjectType[] = [
  'Academic',
  'Personal',
  'Internship',
  'Hackathon',
  'Research',
]

export interface Project {
  id: number
  title: string
  description: string | null
  technologies: string[]
  project_type: ProjectType
  role: string | null
  github_url: string | null
  demo_url: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface ProjectPayload {
  title: string
  description?: string | null
  technologies: string[]
  project_type: ProjectType
  role?: string | null
  github_url?: string | null
  demo_url?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface Certification {
  id: number
  name: string
  issuing_organization: string | null
  issue_date: string | null
  credential_url: string | null
  description: string | null
  created_at: string
}

export interface CertificationPayload {
  name: string
  issuing_organization?: string | null
  issue_date?: string | null
  credential_url?: string | null
  description?: string | null
}

export type RolePriority = 'Primary' | 'Secondary'

export const ROLE_PRIORITIES: RolePriority[] = ['Primary', 'Secondary']

export interface CareerGoal {
  id: number
  role_name: string
  priority: RolePriority
  target_date: string | null
  created_at: string
}

export interface CareerGoalPayload {
  role_name: string
  priority: RolePriority
  target_date?: string | null
}

export interface CompletionFactor {
  key: string
  label: string
  weight: number
  complete: boolean
}

export interface ProfileCompletion {
  percent: number
  factors: CompletionFactor[]
}

export interface ActivityItem {
  type: string
  description: string
  timestamp: string
}

export interface DashboardStats {
  skills_count: number
  projects_count: number
  certifications_count: number
  target_roles_count: number
}

export interface DashboardData {
  user: UserPublic
  profile_completion: ProfileCompletion
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  target_roles: CareerGoal[]
  stats: DashboardStats
  recent_activity: ActivityItem[]
}
