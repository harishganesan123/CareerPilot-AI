import apiClient from './client'
import type {
  CareerGoal,
  CareerGoalPayload,
  Certification,
  CertificationPayload,
  DashboardData,
  Project,
  ProjectPayload,
  Skill,
  SkillPayload,
} from '../types/career'

// --- Skills ---
export async function fetchSkills(): Promise<Skill[]> {
  const { data } = await apiClient.get<Skill[]>('/skills')
  return data
}

export async function createSkill(payload: SkillPayload): Promise<Skill> {
  const { data } = await apiClient.post<Skill>('/skills', payload)
  return data
}

export async function updateSkill(id: number, payload: Partial<SkillPayload>): Promise<Skill> {
  const { data } = await apiClient.patch<Skill>(`/skills/${id}`, payload)
  return data
}

export async function deleteSkill(id: number): Promise<void> {
  await apiClient.delete(`/skills/${id}`)
}

// --- Projects ---
export async function fetchProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>('/projects')
  return data
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects', payload)
  return data
}

export async function updateProject(
  id: number,
  payload: Partial<ProjectPayload>,
): Promise<Project> {
  const { data } = await apiClient.patch<Project>(`/projects/${id}`, payload)
  return data
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`)
}

// --- Certifications ---
export async function fetchCertifications(): Promise<Certification[]> {
  const { data } = await apiClient.get<Certification[]>('/certifications')
  return data
}

export async function createCertification(
  payload: CertificationPayload,
): Promise<Certification> {
  const { data } = await apiClient.post<Certification>('/certifications', payload)
  return data
}

export async function updateCertification(
  id: number,
  payload: Partial<CertificationPayload>,
): Promise<Certification> {
  const { data } = await apiClient.patch<Certification>(`/certifications/${id}`, payload)
  return data
}

export async function deleteCertification(id: number): Promise<void> {
  await apiClient.delete(`/certifications/${id}`)
}

// --- Career goals ---
export async function fetchCareerGoals(): Promise<CareerGoal[]> {
  const { data } = await apiClient.get<CareerGoal[]>('/career-goals')
  return data
}

export async function createCareerGoal(payload: CareerGoalPayload): Promise<CareerGoal> {
  const { data } = await apiClient.post<CareerGoal>('/career-goals', payload)
  return data
}

export async function updateCareerGoal(
  id: number,
  payload: Partial<CareerGoalPayload>,
): Promise<CareerGoal> {
  const { data } = await apiClient.patch<CareerGoal>(`/career-goals/${id}`, payload)
  return data
}

export async function deleteCareerGoal(id: number): Promise<void> {
  await apiClient.delete(`/career-goals/${id}`)
}

// --- Dashboard ---
export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>('/dashboard')
  return data
}
