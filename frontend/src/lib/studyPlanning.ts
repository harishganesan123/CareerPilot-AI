import type { StudyTask } from '../api/studyTasks'

const normalize = (value: string) => value.trim().toLowerCase()

/**
 * True when the student already has an open (not completed) task for this
 * skill. Completed tasks do not count, so a finished skill can be revisited.
 */
export function isSkillPlanned(skill: string, tasks: Pick<StudyTask, 'subject' | 'status'>[]): boolean {
  const key = normalize(skill)
  return tasks.some((task) => task.status !== 'Completed' && normalize(task.subject) === key)
}
