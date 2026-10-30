import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { fetchCareerRoles } from '../api/skillGap'
import type { CareerRoleOption } from '../api/skillGap'
import {
  fetchStudyRecommendations,
  generateAIStudyRecommendations,
  recommendationErrorMessage,
} from '../api/studyRecommendations'
import type {
  RecommendationSource,
  StudyRecommendation,
  StudyRecommendationResult,
} from '../api/studyRecommendations'
import type { StudyTask } from '../api/studyTasks'
import { useToast } from '../context/ToastContext'
import { isSkillPlanned } from '../lib/studyPlanning'

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

const priorityStyle: Record<StudyRecommendation['priority'], string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-blue-50 text-blue-700',
  Low: 'bg-slate-100 text-slate-600',
}

interface PanelError {
  message: string
  failedMode: RecommendationSource
}

interface Props {
  /** The student's current tasks, used to mark skills that are already planned. */
  tasks: StudyTask[]
  /** Pre-fills the planner's task form; the student reviews and saves it. */
  onCreateTask: (recommendation: StudyRecommendation) => void
}

export default function StudyRecommendationsPanel({ tasks, onCreateTask }: Props) {
  const { notifySuccess, notifyError } = useToast()

  const [roles, setRoles] = useState<CareerRoleOption[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [selectedRole, setSelectedRole] = useState('')
  const [result, setResult] = useState<StudyRecommendationResult | null>(null)
  const [loadingMode, setLoadingMode] = useState<RecommendationSource | null>(null)
  const [error, setError] = useState<PanelError | null>(null)

  // Identifies the latest request so a slow response cannot land after the role changed.
  // (Double submits are prevented by disabling the buttons while a request is running.)
  const requestId = useRef(0)

  useEffect(() => {
    let cancelled = false
    fetchCareerRoles()
      .then((available) => {
        if (cancelled) return
        setRoles(available)
        setSelectedRole((current) => current || available[0]?.role_name || '')
      })
      .catch((err: unknown) => {
        if (!cancelled) notifyError(recommendationErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoles(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function run(mode: RecommendationSource) {
    if (!selectedRole) return
    const id = ++requestId.current
    setLoadingMode(mode)
    setError(null)

    try {
      const response =
        mode === 'ai'
          ? await generateAIStudyRecommendations(selectedRole)
          : await fetchStudyRecommendations(selectedRole)
      if (id !== requestId.current) return
      if (!response || !Array.isArray(response.recommendations)) {
        throw new Error('malformed')
      }
      setResult(response)
      notifySuccess(
        mode === 'ai' ? 'AI study recommendations generated.' : 'Rule-based suggestions loaded.',
      )
    } catch (err) {
      if (id !== requestId.current) return
      // Never fabricate suggestions: show the failure and let the student choose.
      const message =
        err instanceof Error && err.message === 'malformed'
          ? 'The server returned an unexpected response. Please try again.'
          : recommendationErrorMessage(err)
      setError({ message, failedMode: mode })
      notifyError(message)
    } finally {
      if (id === requestId.current) setLoadingMode(null)
    }
  }

  function handleRoleChange(role: string) {
    // Invalidate any in-flight request so a late response cannot overwrite this role's view.
    requestId.current++
    setLoadingMode(null)
    setSelectedRole(role)
    setResult(null)
    setError(null)
  }

  const isBusy = loadingMode !== null
  const canRun = !isLoadingRoles && !isBusy && selectedRole !== ''
  const source: RecommendationSource = result?.source ?? 'rule_based'

  return (
    <section
      aria-labelledby="study-recommendations-heading"
      className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 id="study-recommendations-heading" className="text-lg font-semibold text-slate-900">
            Personalized study recommendations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a career goal to identify missing skills and turn learning suggestions into study
            tasks. AI recommendations use your recorded skills and tasks; rule-based suggestions use
            a fixed list per role.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <select
          aria-label="Target career role"
          value={selectedRole}
          onChange={(event) => handleRoleChange(event.target.value)}
          disabled={isLoadingRoles || roles.length === 0}
          className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
        >
          {roles.length === 0 && (
            <option value="">{isLoadingRoles ? 'Loading career roles…' : 'No career roles available'}</option>
          )}
          {roles.map((role) => (
            <option key={role.role_name} value={role.role_name}>
              {role.role_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void run('ai')}
          disabled={!canRun}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingMode === 'ai' ? (
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles size={17} aria-hidden="true" />
          )}
          {loadingMode === 'ai' ? 'Generating with AI…' : 'Generate AI recommendations'}
        </button>

        <button
          type="button"
          onClick={() => void run('rule_based')}
          disabled={!canRun}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingMode === 'rule_based' ? (
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <ListChecks size={17} aria-hidden="true" />
          )}
          Rule-based suggestions
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1">
              {error.failedMode === 'ai' ? 'AI recommendations could not be generated. ' : ''}
              {error.message}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run(error.failedMode)}
              disabled={!canRun}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Retry
            </button>
            {error.failedMode === 'ai' && (
              <button
                type="button"
                onClick={() => void run('rule_based')}
                disabled={!canRun}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                <ListChecks size={13} aria-hidden="true" />
                Show rule-based suggestions instead
              </button>
            )}
          </div>
        </div>
      )}

      {!result && !error && !isBusy && (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
          Choose a role, then generate recommendations to see which skills to learn next.
        </p>
      )}

      <div aria-live="polite">
        {result && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-violet-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-violet-950">{result.role_name}</p>
                    <span
                      data-testid="source-badge"
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        source === 'ai' ? 'bg-violet-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {source === 'ai' ? <Sparkles size={12} aria-hidden="true" /> : null}
                      {source === 'ai' ? 'AI-generated' : 'Rule-based'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-violet-800">
                    {result.readiness_level} readiness · {result.missing_count} missing skills
                  </p>
                </div>
                <span className="text-2xl font-bold text-violet-800">{result.readiness_score}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Role skill coverage"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.max(0, Math.min(100, result.readiness_score))}
                className="mt-3 h-2 overflow-hidden rounded-full bg-violet-200"
              >
                <div
                  className="h-full rounded-full bg-violet-700 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, result.readiness_score))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-violet-800">
                Coverage score is rule-based: the share of listed role skills in your profile. AI
                suggestions never change it.
              </p>
            </div>

            {result.recommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={30} aria-hidden="true" />
                <p className="mt-2 font-semibold text-slate-800">No missing skills found for this role</p>
                <p className="mt-1 text-sm text-slate-500">
                  Based on your recorded profile, no listed role requirements are missing. You can
                  still create tasks to improve proficiency through projects and practice.
                </p>
              </div>
            ) : (
              result.recommendations.map((recommendation) => {
                const planned = recommendation.already_planned === true || isSkillPlanned(recommendation.skill_name, tasks)
                return (
                  <article
                    key={recommendation.skill_name}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {recommendation.order !== undefined && (
                            <span
                              aria-label={`Step ${recommendation.order}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-800"
                            >
                              {recommendation.order}
                            </span>
                          )}
                          <h3 className="font-semibold text-slate-900">{recommendation.skill_name}</h3>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityStyle[recommendation.priority]}`}>
                            {recommendation.priority} priority
                          </span>
                          {planned && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              In your planner
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-5 text-slate-600">{recommendation.reason}</p>

                        <div className="mt-3 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Suggested learning activity
                          </p>
                          <p className="mt-1 text-sm leading-5 text-slate-700">{recommendation.suggested_activity}</p>
                        </div>

                        {recommendation.expected_outcome && (
                          <p className="mt-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-700">Expected outcome: </span>
                            {recommendation.expected_outcome}
                          </p>
                        )}

                        {recommendation.prerequisites && recommendation.prerequisites.length > 0 && (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-700">Learn first: </span>
                            {recommendation.prerequisites.join(', ')}
                          </p>
                        )}

                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 size={14} aria-hidden="true" />
                          Estimated time: {formatDuration(recommendation.estimated_minutes)}
                          {source === 'ai' ? ' (first session, estimate)' : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCreateTask(recommendation)}
                        disabled={planned}
                        aria-label={
                          planned
                            ? `${recommendation.skill_name} is already in your planner`
                            : `Create task for ${recommendation.skill_name}`
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={16} aria-hidden="true" />
                        {planned ? 'In planner' : 'Create task'}
                      </button>
                    </div>
                  </article>
                )
              })
            )}

            <p className="text-xs leading-5 text-slate-500">
              {result.method_note}
              {source === 'ai' && ' AI-generated content may be inaccurate; treat it as a starting point.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
