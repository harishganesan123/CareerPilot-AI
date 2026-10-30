
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Award,
  BrainCircuit,
  Briefcase,
  CalendarClock,
  CheckCircle2,
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
    description: 'Get help understanding your study materials and academic questions.',
    action: 'Open Assistant',
    to: '/ai/assistant',
    icon: BrainCircuit,
  },
  {
    title: 'Smart Study Planner',
    description: 'Organize your learning with a structured study schedule.',
    action: 'Create Study Plan',
    to: '/ai/study-planner',
    icon: CalendarClock,
  },
  {
    title: 'Resume Analyzer',
    description: 'Review your resume and identify opportunities for improvement.',
    action: 'Analyze Resume',
    to: '/ai/resume-analyzer',
    icon: FileSearch,
  },
  {
    title: 'Skill Gap Analysis',
    description: 'Identify skills to develop for your preferred career path.',
    action: 'Analyze Skills',
    to: '/ai/skill-gap',
    icon: TrendingUp,
  },
  {
    title: 'Career Recommendations',
    description: 'Explore career directions aligned with your profile and goals.',
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
      className="group rounded-2xl border border-[#E2ECF1] bg-white p-5 shadow-[0_2px_12px_rgba(29,63,90,0.03)] transition duration-300 hover:-translate-y-1 hover:border-[#96CAD3] hover:shadow-[0_14px_30px_rgba(29,63,90,0.08)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#718597]">
          {label}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F7FA] text-[#437B98] transition group-hover:bg-[#1D3F5A] group-hover:text-white">
          <Icon size={17} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#1D3F5A]">
        {value}
      </p>
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#437B98]">
        View details
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-[#E2ECF1] bg-white p-5 shadow-[0_2px_12px_rgba(29,63,90,0.025)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  )
}

function SectionHeading({
  children,
  icon: Icon,
}: {
  children: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex items-center gap-2.5">
      {Icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F7FA] text-[#437B98]">
          <Icon size={17} strokeWidth={1.8} />
        </span>
      )}
      <h3 className="text-sm font-semibold tracking-tight text-[#1D3F5A] sm:text-base">
        {children}
      </h3>
    </div>
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
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#E2ECF1] bg-white">
          <div className="flex items-center gap-3 text-sm text-[#5B6F81]">
            <Loader2 size={19} className="animate-spin text-[#437B98]" />
            Loading your dashboard…
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <h2 className="font-semibold text-[#1D3F5A]">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-red-700">
            {error || 'Could not load dashboard.'}
          </p>
          <button
            onClick={load}
            className="mt-4 rounded-xl bg-[#1D3F5A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#437B98]"
          >
            Try again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const {
    user,
    stats,
    profile_completion,
    skills,
    target_roles,
    recent_activity,
  } = data

  const primaryRole = target_roles.find((role) => role.priority === 'Primary')
  const incomplete = profile_completion.factors.filter((factor) => !factor.complete)

  return (
    <DashboardLayout title="Dashboard">
      <div className="mx-auto max-w-[1500px] space-y-7">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D3F5A] via-[#285773] to-[#437B98] p-6 text-white shadow-[0_16px_40px_rgba(29,63,90,0.16)] sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-14 h-44 w-44 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-[#96CAD3]/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#D6EAF0]">
                <Sparkles size={14} />
                Your personal career workspace
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Welcome back, {user.name}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                Every skill, project, and learning milestone moves you closer to your career goals.
                Here’s your progress at a glance.
              </p>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1D3F5A] shadow-sm transition hover:bg-[#F0F7FA] sm:self-auto"
            >
              View my profile
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Profile completion */}
        <SectionCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionHeading icon={CheckCircle2}>Profile completion</SectionHeading>
              <p className="mt-2 text-sm text-[#718597]">
                Complete these details to build a stronger career profile.
              </p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-[#1D3F5A]">
              {profile_completion.percent}
              <span className="ml-0.5 text-lg text-[#437B98]">%</span>
            </p>
          </div>

          <div
            className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[#EDF3F6]"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuenow={profile_completion.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1D3F5A] via-[#437B98] to-[#96CAD3] transition-all duration-700"
              style={{ width: `${profile_completion.percent}%` }}
            />
          </div>

          {incomplete.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {incomplete.map((factor) => (
                <span
                  key={factor.key}
                  className="rounded-full border border-[#E2ECF1] bg-[#F8FBFC] px-3 py-1.5 text-xs font-medium text-[#5B6F81]"
                >
                  {factor.label}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Profile statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Skills" value={stats.skills_count} icon={Wrench} to="/skills" />
          <StatCard label="Projects" value={stats.projects_count} icon={FolderGit2} to="/projects" />
          <StatCard
            label="Certifications"
            value={stats.certifications_count}
            icon={Award}
            to="/certifications"
          />
          <StatCard
            label="Career goals"
            value={stats.target_roles_count}
            icon={Target}
            to="/career-goals"
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Target career */}
            <SectionCard>
              <SectionHeading icon={Target}>Target career</SectionHeading>

              {primaryRole ? (
                <div className="mt-5 rounded-2xl border border-[#D6EAF0] bg-[#F8FBFC] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#718597]">
                    Primary career goal
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-[#1D3F5A]">
                    {primaryRole.role_name}
                  </p>

                  {primaryRole.target_date && (
                    <p className="mt-2 text-sm text-[#5B6F81]">
                      Target date: {primaryRole.target_date}
                    </p>
                  )}

                  {target_roles.filter((role) => role.priority === 'Secondary').length > 0 && (
                    <p className="mt-4 border-t border-[#E2ECF1] pt-3 text-sm text-[#5B6F81]">
                      <span className="font-medium text-[#1D3F5A]">Also considering: </span>
                      {target_roles
                        .filter((role) => role.priority === 'Secondary')
                        .map((role) => role.role_name)
                        .join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[#C8DCE5] bg-[#F8FBFC] p-5">
                  <p className="text-sm text-[#5B6F81]">
                    No primary career goal has been set yet.
                  </p>
                  <button
                    onClick={() => navigate('/career-goals')}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1D3F5A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#437B98]"
                  >
                    Set career goal
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Skills overview */}
            <SectionCard>
              <div className="flex items-center justify-between gap-3">
                <SectionHeading icon={Wrench}>Skills overview</SectionHeading>
                {skills.length > 0 && (
                  <Link
                    to="/skills"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#437B98] transition hover:text-[#1D3F5A]"
                  >
                    Manage skills
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>

              {skills.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#C8DCE5] p-5">
                  <p className="text-sm text-[#5B6F81]">No skills added yet.</p>
                  <button
                    onClick={() => navigate('/skills')}
                    className="mt-4 rounded-xl bg-[#1D3F5A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#437B98]"
                  >
                    + Add your first skill
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-5 space-y-5">
                    {skills.slice(0, 6).map((skill) => (
                      <div key={skill.id}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-[#29465D]">
                            {skill.skill_name}
                          </span>
                          <span className="shrink-0 text-xs text-[#718597]">
                            {skill.proficiency}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EDF3F6]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#437B98] to-[#96CAD3]"
                            style={{ width: `${skill.proficiency_percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-xs leading-5 text-[#8294A3]">
                    Progress bars reflect your self-reported proficiency, not an objective measurement.
                  </p>
                </>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            {/* Placement readiness */}
            <SectionCard>
              <SectionHeading icon={Briefcase}>Placement readiness</SectionHeading>
              <div className="mt-5 rounded-2xl bg-[#F8FBFC] p-4">
                <p className="text-sm leading-6 text-[#5B6F81]">
                  Your readiness indicator will become more meaningful as you complete your career
                  profile and practice for placements.
                </p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="mt-4 w-full rounded-xl border border-[#D6E3EA] px-4 py-2.5 text-sm font-semibold text-[#1D3F5A] transition hover:border-[#96CAD3] hover:bg-[#F0F7FA]"
              >
                Complete profile
              </button>
            </SectionCard>

            {/* Recent activity */}
            <SectionCard>
              <SectionHeading icon={Activity}>Recent activity</SectionHeading>

              {recent_activity.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-[#718597]">
                  No activity yet. Updates to your profile will appear here.
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {recent_activity.map((item, index) => (
                    <li key={`${item.type}-${index}`} className="flex gap-3">
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F7FA] text-[#437B98]">
                        <Activity size={13} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-[#29465D]">
                          {item.description}
                        </p>
                        <p className="mt-1 text-xs text-[#8294A3]">
                          {formatWhen(item.timestamp)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>

        {/* AI tools */}
        <section>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#437B98]">
              Career development
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#1D3F5A]">
              Your AI toolkit
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718597]">
              Explore the tools available in your career workspace. Some modules may still be under
              development.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {aiModules.map((module) => (
              <article
                key={module.title}
                className="group flex h-full flex-col rounded-2xl border border-[#E2ECF1] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#96CAD3] hover:shadow-[0_14px_30px_rgba(29,63,90,0.07)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D6EAF0] bg-[#F0F7FA] text-[#356780] transition group-hover:bg-[#1D3F5A] group-hover:text-white">
                  <module.icon size={20} strokeWidth={1.8} />
                </span>
                <h4 className="mt-4 text-sm font-semibold text-[#1D3F5A]">
                  {module.title}
                </h4>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#718597]">
                  {module.description}
                </p>
                <button
                  onClick={() => navigate(module.to)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6E3EA] px-3 py-2.5 text-sm font-semibold text-[#1D3F5A] transition hover:border-[#96CAD3] hover:bg-[#F0F7FA]"
                >
                  {module.action}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
