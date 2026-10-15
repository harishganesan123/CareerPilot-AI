import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Award,
  BrainCircuit,
  Briefcase,
  CalendarClock,
  FileSearch,
  FolderGit2,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { fetchDashboard } from '../api/career'
import { toApiError } from '../api/client'
import type { ApiError } from '../api/client'
import type { DashboardData } from '../types/career'

const aiModules: {
  title: string
  description: string
  action: string
  to: string
  icon: LucideIcon
}[] = [
  {
    title: 'AI Academic Assistant',
    description: 'Ask questions from your study materials.',
    action: 'Open Assistant',
    to: '/ai/assistant',
    icon: BrainCircuit,
  },
  {
    title: 'Smart Study Planner',
    description: 'Build a personalized learning schedule.',
    action: 'Create Study Plan',
    to: '/ai/study-planner',
    icon: CalendarClock,
  },
  {
    title: 'Resume Analyzer',
    description: 'Analyze your resume and identify improvements.',
    action: 'Analyze Resume',
    to: '/ai/resume-analyzer',
    icon: FileSearch,
  },
  {
    title: 'Skill Gap Analysis',
    description: 'Discover what skills you need for your target role.',
    action: 'Analyze Skills',
    to: '/ai/skill-gap',
    icon: TrendingUp,
  },
  {
    title: 'Career Recommendations',
    description: 'Find career paths that match your profile.',
    action: 'Explore Careers',
    to: '/ai/career-recommendations',
    icon: Sparkles,
  },
]

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string
  value: number
  icon: LucideIcon
  to: string
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <Icon size={16} className="text-slate-300" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </Link>
  )
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMins = Math.round((Date.now() - then) / 60000)
  if (Number.isNaN(diffMins)) return ''
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const hours = Math.round(diffMins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      setData(await fetchDashboard())
    } catch (err) {
      setError((toApiError(err) as ApiError).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading your dashboard…
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'Could not load dashboard.'}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const { user, stats, profile_completion, skills, target_roles, recent_activity } = data
  const primaryRole = target_roles.find((r) => r.priority === 'Primary')
  const incomplete = profile_completion.factors.filter((f) => !f.complete)

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Welcome back, {user.name}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's where your career profile stands today.
        </p>
      </div>

      {/* Profile completion */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Profile Completion</h3>
          <span className="text-sm font-semibold text-[var(--color-brand-600)]">
            {profile_completion.percent}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[var(--color-brand-500)] transition-all"
            style={{ width: `${profile_completion.percent}%` }}
          />
        </div>
        {incomplete.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {incomplete.map((factor) => (
              <span
                key={factor.key}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {factor.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Skills" value={stats.skills_count} icon={Wrench} to="/skills" />
        <StatCard
          label="Projects"
          value={stats.projects_count}
          icon={FolderGit2}
          to="/projects"
        />
        <StatCard
          label="Certifications"
          value={stats.certifications_count}
          icon={Award}
          to="/certifications"
        />
        <StatCard
          label="Career Goals"
          value={stats.target_roles_count}
          icon={Target}
          to="/career-goals"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Target career */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Target Career</h3>
            {primaryRole ? (
              <>
                <p className="mt-2 text-lg font-semibold text-[var(--color-brand-600)]">
                  {primaryRole.role_name}
                </p>
                {primaryRole.target_date && (
                  <p className="mt-1 text-xs text-slate-500">
                    Target date: {primaryRole.target_date}
                  </p>
                )}
                {target_roles.filter((r) => r.priority === 'Secondary').length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Also considering:{' '}
                    {target_roles
                      .filter((r) => r.priority === 'Secondary')
                      .map((r) => r.role_name)
                      .join(', ')}
                  </p>
                )}
              </>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-slate-500">
                  No primary career goal set yet.
                </p>
                <button
                  onClick={() => navigate('/career-goals')}
                  className="mt-3 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
                >
                  Set Career Goal
                </button>
              </div>
            )}
          </div>

          {/* Skills overview */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Skills Overview</h3>
              {skills.length > 0 && (
                <Link
                  to="/skills"
                  className="text-xs font-medium text-[var(--color-brand-600)] hover:underline"
                >
                  Manage
                </Link>
              )}
            </div>

            {skills.length === 0 ? (
              <div className="mt-3">
                <p className="text-sm text-slate-500">No skills added yet.</p>
                <button
                  onClick={() => navigate('/skills')}
                  className="mt-3 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
                >
                  + Add Skill
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {skills.slice(0, 6).map((skill) => (
                    <div key={skill.id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {skill.skill_name}
                        </span>
                        <span className="text-slate-400">{skill.proficiency}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[var(--color-brand-500)]"
                          style={{ width: `${skill.proficiency_percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-slate-400">
                  Bars reflect your own self-reported proficiency, not an objective
                  measurement.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Placement readiness */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Briefcase size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">
                Placement Readiness
              </h3>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Not enough data yet. Complete your Career Profile and start practicing to
              generate your readiness indicator.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-4 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Complete Profile
            </button>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
            </div>
            {recent_activity.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No activity yet. Anything you add to your profile will show up here.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recent_activity.map((item, index) => (
                  <li key={`${item.type}-${index}`} className="text-sm">
                    <p className="text-slate-700">{item.description}</p>
                    <p className="text-xs text-slate-400">{formatWhen(item.timestamp)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* AI modules */}
      <div className="mt-8">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">AI Tools</h3>
        <p className="mb-4 text-xs text-slate-500">
          These modules arrive in later phases — the profile data you build now is what
          they'll run on.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiModules.map((module) => (
            <div
              key={module.title}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                <module.icon size={17} />
              </span>
              <h4 className="mt-3 text-sm font-semibold text-slate-900">{module.title}</h4>
              <p className="mt-1 flex-1 text-sm text-slate-500">{module.description}</p>
              <button
                onClick={() => navigate(module.to)}
                className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {module.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
