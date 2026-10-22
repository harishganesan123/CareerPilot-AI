import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import {
  createStudyTask,
  deleteStudyTask,
  fetchStudyTasks,
  updateStudyTask,
} from '../api/studyTasks'
import type {
  StudyPriority,
  StudyTask,
  StudyTaskPayload,
  StudyTaskStatus,
} from '../api/studyTasks'
import { toApiError } from '../api/client'
import { useToast } from '../context/ToastContext'
import { fetchCareerRoles } from '../api/skillGap'
import type { CareerRoleOption } from '../api/skillGap'
import { fetchStudyRecommendations } from '../api/studyRecommendations'
import type {
  StudyRecommendation,
  StudyRecommendationResult,
} from '../api/studyRecommendations'

type TaskFilter = 'All' | StudyTaskStatus

const priorityStyles: Record<StudyPriority, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-50 text-blue-700',
  High: 'bg-rose-50 text-rose-700',
}

const statusStyles: Record<StudyTaskStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}

const emptyForm = {
  title: '',
  description: '',
  subject: '',
  due_date: '',
  estimated_minutes: '60',
  priority: 'Medium' as StudyPriority,
}

function formatDate(value: string | null) {
  if (!value) return 'No deadline'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDuration(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`
  }
  return `${minutes} min`
}

export default function StudyPlannerPage() {
  const { notifySuccess, notifyError } = useToast()

  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState<TaskFilter>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [careerRoles, setCareerRoles] = useState<CareerRoleOption[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [recommendationResult, setRecommendationResult] =
    useState<StudyRecommendationResult | null>(null)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] =
    useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  )

  async function loadTasks() {
    setIsLoading(true)
    setPageError(null)

    try {
      setTasks(await fetchStudyTasks())
    } catch (error) {
      setPageError(toApiError(error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTasks()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadRoles() {
      setIsLoadingRoles(true)

      try {
        const roles = await fetchCareerRoles()

        if (!cancelled) {
          setCareerRoles(roles)
          setSelectedRole((current) => {
            if (current && roles.some((role) => role.role_name === current)) {
              return current
            }
            return roles[0]?.role_name ?? ''
          })
        }
      } catch (error) {
        if (!cancelled) {
          notifyError(toApiError(error).message)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRoles(false)
        }
      }
    }

    void loadRoles()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'Completed').length
    const pending = tasks.filter((task) => task.status === 'Pending').length
    const totalMinutes = tasks
      .filter((task) => task.status !== 'Completed')
      .reduce((sum, task) => sum + task.estimated_minutes, 0)

    return {
      total: tasks.length,
      completed,
      pending,
      progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      remainingMinutes: totalMinutes,
    }
  }, [tasks])

  const filteredTasks = useMemo(
    () =>
      filter === 'All'
        ? tasks
        : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  )

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.title.trim() || !form.subject.trim()) {
      setFormError('Please enter both a task title and a subject.')
      return
    }

    const minutes = Number(form.estimated_minutes)
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) {
      setFormError('Study duration must be between 5 and 1440 minutes.')
      return
    }

    const payload: StudyTaskPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      due_date: form.due_date || null,
      estimated_minutes: minutes,
      priority: form.priority,
    }

    setIsSaving(true)
    try {
      const created = await createStudyTask(payload)
      setTasks((current) => [created, ...current])
      setForm(emptyForm)
      notifySuccess('Study task created.')
    } catch (error) {
      const message = toApiError(error).message
      setFormError(message)
      notifyError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(task: StudyTask) {
    const nextStatus: StudyTaskStatus =
      task.status === 'Pending'
        ? 'In Progress'
        : task.status === 'In Progress'
          ? 'Completed'
          : 'Pending'

    setUpdatingId(task.id)
    try {
      const updated = await updateStudyTask(task.id, { status: nextStatus })
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      notifySuccess(`Task marked ${nextStatus.toLowerCase()}.`)
    } catch (error) {
      notifyError(toApiError(error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(task: StudyTask) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(task.id)
    try {
      await deleteStudyTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      notifySuccess('Study task deleted.')
    } catch (error) {
      notifyError(toApiError(error).message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleGenerateRecommendations() {
    if (!selectedRole) {
      setRecommendationError('Select a career role to generate recommendations.')
      return
    }

    setIsGeneratingRecommendations(true)
    setRecommendationError(null)

    try {
      const result = await fetchStudyRecommendations(selectedRole)
      setRecommendationResult(result)
      notifySuccess('Study recommendations generated.')
    } catch (error) {
      const message = toApiError(error).message
      setRecommendationError(message)
      notifyError(message)
    } finally {
      setIsGeneratingRecommendations(false)
    }
  }

  function handleCreateRecommendedTask(recommendation: StudyRecommendation) {
    setForm({
      title: `Learn ${recommendation.skill_name}`,
      description: recommendation.suggested_activity,
      subject: recommendation.skill_name,
      due_date: '',
      estimated_minutes: String(recommendation.estimated_minutes),
      priority: recommendation.priority,
    })
    setFormError(null)

    document.getElementById('study-task-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    notifySuccess('Review the pre-filled form and save your task.')
  }

  return (
    <DashboardLayout title="Study Planner">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <CalendarDays size={14} />
                Your learning workspace
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Make every study session count.
              </h1>
              <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                Organize your subjects, set priorities, and track your progress
                toward your learning goals.
              </p>
            </div>
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
              <BookOpen size={38} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<Target size={19} />} label="Total tasks" value={stats.total} />
          <StatCard icon={<CheckCircle2 size={19} />} label="Completed" value={stats.completed} />
          <StatCard icon={<Clock3 size={19} />} label="Pending" value={stats.pending} />
          <StatCard
            icon={<CalendarDays size={19} />}
            label="Study time left"
            value={formatDuration(stats.remainingMinutes)}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create a study task
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add a subject, deadline, and realistic study duration.
              </p>
            </div>
            <span className="hidden rounded-xl bg-blue-50 p-3 text-blue-700 sm:block">
              <Plus size={20} />
            </span>
          </div>

          <form
            id="study-task-form"
            onSubmit={handleCreate}
            className="mt-5 space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Task title *"
                value={form.title}
                placeholder="e.g. Revise neural networks"
                onChange={(value) => setForm({ ...form, title: value })}
                required
              />
              <FormInput
                label="Subject *"
                value={form.subject}
                placeholder="e.g. Deep Learning"
                onChange={(value) => setForm({ ...form, subject: value })}
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm({ ...form, due_date: event.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Estimated study time
                </label>
                <select
                  value={form.estimated_minutes}
                  onChange={(event) =>
                    setForm({ ...form, estimated_minutes: event.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1 hour 30 minutes</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What do you want to cover in this session?"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as StudyPriority,
                    })
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {formError && (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {formError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={17} />
                )}
                {isSaving ? 'Creating task…' : 'Add study task'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Personalized study recommendations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a career goal to identify missing skills and turn learning
                suggestions into study tasks.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Target career role"
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value)
                setRecommendationResult(null)
                setRecommendationError(null)
              }}
              disabled={isLoadingRoles || careerRoles.length === 0}
              className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
            >
              {careerRoles.length === 0 && (
                <option value="">
                  {isLoadingRoles ? 'Loading career roles…' : 'No career roles available'}
                </option>
              )}
              {careerRoles.map((role) => (
                <option key={role.role_name} value={role.role_name}>
                  {role.role_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void handleGenerateRecommendations()}
              disabled={
                isLoadingRoles ||
                isGeneratingRecommendations ||
                !selectedRole
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingRecommendations ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}
              {isGeneratingRecommendations
                ? 'Generating…'
                : 'Generate recommendations'}
            </button>
          </div>

          {recommendationError && (
            <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {recommendationError}
            </div>
          )}

          {recommendationResult && (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-violet-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-violet-950">
                      {recommendationResult.role_name}
                    </p>
                    <p className="mt-1 text-sm text-violet-800">
                      {recommendationResult.readiness_level} readiness
                      {' · '}
                      {recommendationResult.missing_count} missing skills
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-violet-800">
                    {recommendationResult.readiness_score}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-200">
                  <div
                    className="h-full rounded-full bg-violet-700 transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, recommendationResult.readiness_score),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {recommendationResult.recommendations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <CheckCircle2 className="mx-auto text-emerald-600" size={30} />
                  <p className="mt-2 font-semibold text-slate-800">
                    No missing skills found for this role
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Based on your recorded profile, no listed role requirements
                    are missing. You can still create tasks to improve proficiency
                    through projects and practice.
                  </p>
                </div>
              ) : (
                recommendationResult.recommendations.map((recommendation) => (
                  <article
                    key={recommendation.skill_name}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-violet-200"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {recommendation.skill_name}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              recommendation.priority === 'High'
                                ? 'bg-rose-50 text-rose-700'
                                : recommendation.priority === 'Medium'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {recommendation.priority} priority
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {recommendation.reason}
                        </p>

                        <div className="mt-3 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Suggested learning activity
                          </p>
                          <p className="mt-1 text-sm leading-5 text-slate-700">
                            {recommendation.suggested_activity}
                          </p>
                        </div>

                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 size={14} />
                          Estimated time:{' '}
                          {formatDuration(recommendation.estimated_minutes)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCreateRecommendedTask(recommendation)
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                      >
                        <Plus size={16} />
                        Create task
                      </button>
                    </div>
                  </article>
                ))
              )}

              <p className="text-xs leading-5 text-slate-500">
                {recommendationResult.method_note}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Your study tasks
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update a task's status as you make progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadTasks()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Refresh
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Overall completion</span>
              <span className="font-semibold text-blue-700">{stats.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(['All', 'Pending', 'In Progress', 'Completed'] as TaskFilter[]).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === option
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option}
                  {option === 'All'
                    ? ` (${tasks.length})`
                    : ` (${tasks.filter((task) => task.status === option).length})`}
                </button>
              ),
            )}
          </div>

          {pageError && (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <div>
                <p>{pageError}</p>
                <button
                  type="button"
                  onClick={() => void loadTasks()}
                  className="mt-1 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading your study tasks…
            </div>
          ) : !pageError && filteredTasks.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <BookOpen className="mx-auto text-slate-400" size={30} />
              <h3 className="mt-3 font-semibold text-slate-800">
                {filter === 'All'
                  ? 'No study tasks yet'
                  : `No ${filter.toLowerCase()} tasks`}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {filter === 'All'
                  ? 'Create your first task above to start organizing your learning.'
                  : 'Try another filter or update a task status.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-semibold text-slate-900 ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityStyles[task.priority]}`}>
                          {task.priority} priority
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-blue-700">
                        {task.subject}
                      </p>
                      {task.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-500">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {formatDate(task.due_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {formatDuration(task.estimated_minutes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                        {task.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(task)}
                        disabled={updatingId === task.id}
                        title={
                          task.status === 'Pending'
                            ? 'Start task'
                            : task.status === 'In Progress'
                              ? 'Mark completed'
                              : 'Reopen task'
                        }
                        aria-label={`Change status for ${task.title}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                      >
                        {updatingId === task.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : task.status === 'In Progress' ? (
                          <Check size={16} />
                        ) : (
                          <RefreshCw size={15} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(task)}
                        disabled={deletingId === task.id}
                        aria-label={`Delete ${task.title}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === task.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-blue-700">{icon}</div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function FormInput({
  label,
  value,
  placeholder,
  onChange,
  required = false,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        maxLength={200}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}
