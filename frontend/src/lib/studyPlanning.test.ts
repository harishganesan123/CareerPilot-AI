import { describe, expect, it } from 'vitest'
import { isSkillPlanned } from './studyPlanning'

const task = (subject: string, status: 'Pending' | 'In Progress' | 'Completed') => ({ subject, status })

describe('isSkillPlanned', () => {
  it('is true for an open task on the same skill, ignoring case and whitespace', () => {
    expect(isSkillPlanned('SQL', [task('  sql ', 'Pending')])).toBe(true)
    expect(isSkillPlanned('SQL', [task('SQL', 'In Progress')])).toBe(true)
  })

  it('is false when the only task is completed, so a finished skill can be revisited', () => {
    expect(isSkillPlanned('SQL', [task('SQL', 'Completed')])).toBe(false)
  })

  it('is false for other subjects and for no tasks', () => {
    expect(isSkillPlanned('SQL', [task('Git', 'Pending')])).toBe(false)
    expect(isSkillPlanned('SQL', [])).toBe(false)
  })

  it('does not treat a substring as a match', () => {
    expect(isSkillPlanned('SQL', [task('NoSQL', 'Pending')])).toBe(false)
  })
})
