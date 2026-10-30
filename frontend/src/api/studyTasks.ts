import apiClient from './client'

export type StudyPriority = 'Low' | 'Medium' | 'High'
export type StudyTaskStatus = 'Pending' | 'In Progress' | 'Completed'

export interface StudyTask {
  id: number
  title: string
  description: string
  subject: string
  due_date: string | null
  estimated_minutes: number
  priority: StudyPriority
  status: StudyTaskStatus
  created_at: string
  updated_at: string
}

export interface StudyTaskPayload {
  title: string
  description: string
  subject: string
  due_date: string | null
  estimated_minutes: number
  priority: StudyPriority
}

export async function fetchStudyTasks(): Promise<StudyTask[]> {
  const { data } = await apiClient.get<StudyTask[]>('/study-tasks')
  return data
}

export async function createStudyTask(
  payload: StudyTaskPayload,
): Promise<StudyTask> {
  const { data } = await apiClient.post<StudyTask>('/study-tasks', payload)
  return data
}

export async function updateStudyTask(
  id: number,
  payload: Partial<StudyTaskPayload> & { status?: StudyTaskStatus },
): Promise<StudyTask> {
  const { data } = await apiClient.patch<StudyTask>(
    `/study-tasks/${id}`,
    payload,
  )
  return data
}

export async function deleteStudyTask(id: number): Promise<void> {
  await apiClient.delete(`/study-tasks/${id}`)
}
