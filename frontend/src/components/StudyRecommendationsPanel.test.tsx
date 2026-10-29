import { AxiosError } from 'axios'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StudyRecommendationsPanel from './StudyRecommendationsPanel'
import * as skillGapApi from '../api/skillGap'
import * as recApi from '../api/studyRecommendations'
import type { StudyRecommendation, StudyRecommendationResult } from '../api/studyRecommendations'
import type { StudyTask } from '../api/studyTasks'

const toast = vi.hoisted(() => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

vi.mock('../context/ToastContext', () => ({ useToast: () => toast }))
vi.mock('../api/skillGap', () => ({ fetchCareerRoles: vi.fn() }))
vi.mock('../api/studyRecommendations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/studyRecommendations')>()),
  fetchStudyRecommendations: vi.fn(),
  generateAIStudyRecommendations: vi.fn(),
}))

const fetchRoles = vi.mocked(skillGapApi.fetchCareerRoles)
const fetchRuleBased = vi.mocked(recApi.fetchStudyRecommendations)
const generateAI = vi.mocked(recApi.generateAIStudyRecommendations)

const ROLES = [
  { role_name: 'AI Engineer', description: 'd', required_skills: ['Python'] },
  { role_name: 'Data Analyst', description: 'd', required_skills: ['SQL'] },
]

const rec = (skill: string, extra: Partial<StudyRecommendation> = {}): StudyRecommendation => ({
  skill_name: skill,
  priority: 'High',
  estimated_minutes: 90,
  reason: `Why ${skill} matters.`,
  suggested_activity: `Practise ${skill}.`,
  ...extra,
})

const aiResult = (recs: StudyRecommendation[] = []): StudyRecommendationResult => ({
  role_name: 'AI Engineer',
  readiness_score: 25,
  readiness_level: 'Developing',
  missing_count: 6,
  source: 'ai',
  model: 'gemini-test',
  method_note: 'AI note.',
  recommendations: recs.length
    ? recs
    : [
        rec('Statistics', { order: 1, prerequisites: ['Python'], expected_outcome: 'Can explain a p-value.' }),
        rec('SQL', { order: 2, priority: 'Medium', estimated_minutes: 45 }),
      ],
})

const ruleResult = (): StudyRecommendationResult => ({
  role_name: 'AI Engineer',
  readiness_score: 25,
  readiness_level: 'Developing',
  missing_count: 6,
  method_note: 'Rule-based note.',
  recommendations: [rec('Python')],
})

const task = (subject: string, status: StudyTask['status']): StudyTask => ({
  id: 1, title: `Learn ${subject}`, description: '', subject, due_date: null,
  estimated_minutes: 60, priority: 'Medium', status, created_at: '', updated_at: '',
})

const httpError = (status: number, detail: string) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status, statusText: '', headers: {}, config: {} as never, data: { detail },
  })

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

async function renderPanel(props: { tasks?: StudyTask[]; onCreateTask?: (r: StudyRecommendation) => void } = {}) {
  const onCreateTask = props.onCreateTask ?? vi.fn()
  render(<StudyRecommendationsPanel tasks={props.tasks ?? []} onCreateTask={onCreateTask} />)
  await waitFor(() => expect(screen.getByRole('button', { name: /generate ai recommendations/i })).toHaveProperty('disabled', false))
  return { onCreateTask }
}

const aiButton = () => screen.getByRole('button', { name: /generat(e|ing)( with)? ai/i })
const ruleButton = () => screen.getByRole('button', { name: /^rule-based suggestions$/i })

beforeEach(() => {
  fetchRoles.mockResolvedValue(ROLES)
  toast.notifySuccess.mockClear()
  toast.notifyError.mockClear()
  generateAI.mockReset()
  fetchRuleBased.mockReset()
})
afterEach(cleanup)

describe('empty and loading states', () => {
  it('shows an empty prompt and makes no recommendation request before the student acts', async () => {
    await renderPanel()
    expect(screen.getByText(/choose a role, then generate recommendations/i)).toBeTruthy()
    expect(generateAI).not.toHaveBeenCalled()
    expect(fetchRuleBased).not.toHaveBeenCalled()
  })

  it('disables actions and explains when roles fail to load', async () => {
    fetchRoles.mockRejectedValue(httpError(500, 'x'))
    render(<StudyRecommendationsPanel tasks={[]} onCreateTask={vi.fn()} />)
    await waitFor(() => expect(toast.notifyError).toHaveBeenCalled())
    expect(aiButton()).toHaveProperty('disabled', true)
    expect(ruleButton()).toHaveProperty('disabled', true)
  })

  it('shows progress, disables both actions and sends only one request on a double click', async () => {
    const pending = deferred<StudyRecommendationResult>()
    generateAI.mockReturnValue(pending.promise)
    await renderPanel()
    fireEvent.click(aiButton())
    fireEvent.click(aiButton())
    expect(await screen.findByRole('button', { name: /generating with ai/i })).toBeTruthy()
    expect(ruleButton()).toHaveProperty('disabled', true)
    expect(generateAI).toHaveBeenCalledTimes(1)
    pending.resolve(aiResult())
    await screen.findByText('Statistics')
  })
})

describe('AI success', () => {
  it('requests the selected role and renders AI-generated recommendations with a clear label', async () => {
    generateAI.mockResolvedValue(aiResult())
    await renderPanel()
    fireEvent.change(screen.getByLabelText(/target career role/i), { target: { value: 'Data Analyst' } })
    fireEvent.click(aiButton())
    await screen.findByText('Statistics')

    expect(generateAI).toHaveBeenCalledWith('Data Analyst')
    expect(fetchRuleBased).not.toHaveBeenCalled()
    expect(screen.getByTestId('source-badge').textContent).toMatch(/ai-generated/i)
    expect(screen.getByLabelText('Step 1')).toBeTruthy()
    expect(screen.getByText(/can explain a p-value/i)).toBeTruthy()
    expect(screen.getByText(/learn first:/i).parentElement?.textContent).toContain('Python')
    expect(screen.getByText(/estimated time: 1h 30m/i)).toBeTruthy()
    expect(screen.getByText(/may be inaccurate/i)).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('25')
    expect(toast.notifySuccess).toHaveBeenCalled()
  })

  it('renders the "no missing skills" state for a role with nothing to learn', async () => {
    generateAI.mockResolvedValue({ ...aiResult(), recommendations: [], missing_count: 0, source: 'rule_based', model: null })
    await renderPanel()
    fireEvent.click(aiButton())
    await screen.findByText(/no missing skills found/i)
    expect(screen.getByTestId('source-badge').textContent).toMatch(/rule-based/i)
  })
})

describe('AI failure', () => {
  it('shows a safe error with Retry and an explicit rule-based option, and does NOT substitute fallback output', async () => {
    generateAI.mockRejectedValue(httpError(502, 'The AI provider is currently unavailable. Please try again shortly.'))
    await renderPanel()
    fireEvent.click(aiButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/could not be generated/i)
    expect(alert.textContent).toMatch(/currently unavailable/i)
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeTruthy()
    expect(within(alert).getByRole('button', { name: /show rule-based suggestions instead/i })).toBeTruthy()

    // nothing was silently substituted
    expect(fetchRuleBased).not.toHaveBeenCalled()
    expect(screen.queryByTestId('source-badge')).toBeNull()
    expect(screen.queryByRole('article')).toBeNull()
    expect(toast.notifyError).toHaveBeenCalled()
  })

  it('Retry re-runs the AI request and shows the result on success', async () => {
    generateAI.mockRejectedValueOnce(httpError(504, 'The AI service took too long to respond. Please try again.'))
    generateAI.mockResolvedValueOnce(aiResult())
    await renderPanel()
    fireEvent.click(aiButton())
    fireEvent.click(await screen.findByRole('button', { name: /retry/i }))
    await screen.findByText('Statistics')
    expect(generateAI).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('source-badge').textContent).toMatch(/ai-generated/i)
  })

  it('shows rule-based suggestions only after the student explicitly asks, labelled Rule-based', async () => {
    generateAI.mockRejectedValue(httpError(503, 'AI features are not configured on this server.'))
    fetchRuleBased.mockResolvedValue(ruleResult())
    await renderPanel()
    fireEvent.click(aiButton())
    fireEvent.click(await screen.findByRole('button', { name: /show rule-based suggestions instead/i }))
    await screen.findByText('Python')
    expect(fetchRuleBased).toHaveBeenCalledWith('AI Engineer')
    expect(screen.getByTestId('source-badge').textContent).toMatch(/rule-based/i)
    expect(screen.queryByText(/ai-generated/i, { selector: '[data-testid="source-badge"]' })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('explains a browser-side timeout', async () => {
    generateAI.mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'))
    await renderPanel()
    fireEvent.click(aiButton())
    expect((await screen.findByRole('alert')).textContent).toMatch(/took too long/i)
  })

  it('explains a network failure', async () => {
    generateAI.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'))
    await renderPanel()
    fireEvent.click(aiButton())
    expect((await screen.findByRole('alert')).textContent).toMatch(/could not reach the server/i)
  })

  it('treats a malformed success response as a failure instead of showing blank results', async () => {
    generateAI.mockResolvedValue({ role_name: 'AI Engineer' } as unknown as StudyRecommendationResult)
    await renderPanel()
    fireEvent.click(aiButton())
    expect((await screen.findByRole('alert')).textContent).toMatch(/unexpected response/i)
    expect(screen.queryByTestId('source-badge')).toBeNull()
  })

  it('a failed rule-based request offers Retry but no AI-to-rule-based switch', async () => {
    fetchRuleBased.mockRejectedValue(httpError(500, 'x'))
    await renderPanel()
    fireEvent.click(ruleButton())
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeTruthy()
    expect(within(alert).queryByRole('button', { name: /show rule-based/i })).toBeNull()
  })
})

describe('rule-based labelling and role changes', () => {
  it('labels results without a source field as Rule-based', async () => {
    fetchRuleBased.mockResolvedValue(ruleResult())
    await renderPanel()
    fireEvent.click(ruleButton())
    await screen.findByText('Python')
    expect(screen.getByTestId('source-badge').textContent).toMatch(/rule-based/i)
    expect(screen.queryByLabelText(/^step/i)).toBeNull()
  })

  it('ignores a late response after the role changed', async () => {
    const pending = deferred<StudyRecommendationResult>()
    generateAI.mockReturnValue(pending.promise)
    await renderPanel()
    fireEvent.click(aiButton())
    fireEvent.change(screen.getByLabelText(/target career role/i), { target: { value: 'Data Analyst' } })
    pending.resolve(aiResult())
    await waitFor(() => expect(aiButton()).toHaveProperty('disabled', false))
    expect(screen.queryByText('Statistics')).toBeNull()
    expect(screen.queryByTestId('source-badge')).toBeNull()
  })
})

describe('adding recommendations to the planner', () => {
  it('passes the chosen recommendation to the planner callback', async () => {
    const result = aiResult()
    generateAI.mockResolvedValue(result)
    const { onCreateTask } = await renderPanel()
    fireEvent.click(aiButton())
    fireEvent.click(await screen.findByRole('button', { name: /create task for sql/i }))
    expect(onCreateTask).toHaveBeenCalledTimes(1)
    expect(onCreateTask).toHaveBeenCalledWith(result.recommendations[1])
  })

  it('marks skills that already have an open task and does not allow duplicates', async () => {
    generateAI.mockResolvedValue(aiResult())
    const { onCreateTask } = await renderPanel({ tasks: [task('statistics', 'In Progress'), task('SQL', 'Completed')] })
    fireEvent.click(aiButton())
    await screen.findByText('Statistics')

    const planned = screen.getByRole('button', { name: /statistics is already in your planner/i })
    expect(planned).toHaveProperty('disabled', true)
    fireEvent.click(planned)
    expect(onCreateTask).not.toHaveBeenCalled()
    expect(screen.getAllByText(/in your planner/i)).toHaveLength(1)
    // a completed task does not block re-learning
    expect(screen.getByRole('button', { name: /create task for sql/i })).toHaveProperty('disabled', false)
  })

  it('respects the server-computed already_planned flag', async () => {
    generateAI.mockResolvedValue(aiResult([rec('Git', { order: 1, already_planned: true })]))
    await renderPanel()
    fireEvent.click(aiButton())
    expect(await screen.findByRole('button', { name: /git is already in your planner/i })).toHaveProperty('disabled', true)
  })
})
