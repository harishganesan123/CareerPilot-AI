import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import {
  fetchCareerRecommendations,
  type CareerRecommendation,
} from '../api/careerRecommendations'
import { toApiError } from '../api/client'

export default function CareerRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([])
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  async function loadRecommendations(refresh = false) {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    setPageError(null)

    try {
      const result = await fetchCareerRecommendations(3)
      setRecommendations(result.recommendations)
      setNote(result.note)
    } catch (error) {
      setPageError(toApiError(error).message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadRecommendations()
  }, [])

  return (
    <DashboardLayout title="Career Recommendations">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <Compass size={14} />
                Career development
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Find a career that fits your skills.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Explore roles that match the skills saved in your profile and identify what to learn next.
              </p>
            </div>
            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 md:flex">
              <BriefcaseBusiness size={44} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recommended career paths</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recommendations are based on the role requirements and skills recorded in your profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRecommendations(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            {isRefreshing || isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isRefreshing ? 'Refreshing…' : 'Refresh recommendations'}
          </button>
        </section>

        {pageError && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to load career recommendations</p>
              <p className="mt-1">{pageError}</p>
              <button type="button" onClick={() => void loadRecommendations()} className="mt-2 inline-flex items-center gap-1 font-semibold underline">
                Try again <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 size={19} className="animate-spin text-blue-700" />
            Finding career paths that match your skills…
          </div>
        ) : !pageError && recommendations.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Sparkles size={27} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No recommendations available yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add your current skills to your profile, then return to explore suitable career paths.
            </p>
            <Link to="/skills" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]">
              Update my skills <ArrowRight size={15} />
            </Link>
          </section>
        ) : !pageError && (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {recommendations.map((role, index) => (
              <article key={role.role_name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Recommendation #{index + 1}</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{role.role_name}</h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-3xl font-bold tracking-tight text-[#1D3F5A]">{Math.round(role.readiness_score)}%</p>
                    <p className="text-xs text-slate-500">skill match</p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">{role.description}</p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${role.role_name} skill match`} aria-valuenow={Math.max(0, Math.min(100, role.readiness_score))} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1D3F5A] to-[#96CAD3] transition-all" style={{ width: `${Math.max(0, Math.min(100, role.readiness_score))}%` }} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#F0F7FA] p-3">
                    <p className="text-xs text-slate-500">Matched skills</p>
                    <p className="mt-1 text-xl font-semibold text-[#1D3F5A]">{role.matched_count}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Skills to develop</p>
                    <p className="mt-1 text-xl font-semibold text-slate-800">{role.missing_count}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Target size={16} className="text-blue-700" /> Suggested next skills
                  </h3>
                  {role.recommended_next_skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role.recommended_next_skills.map((skill) => (
                        <span key={skill} className="rounded-lg border border-[#D6E3EA] bg-[#F8FBFC] px-3 py-1.5 text-xs font-medium text-[#29465D]">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">You match all the listed requirements for this role.</p>
                  )}
                </div>

                <Link to="/ai/skill-gap" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                  View skill-gap analysis <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </section>
        )}

        {!isLoading && !pageError && note && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-blue-700" />
            <p>{note}</p>
          </div>
        )}
        <p className="text-xs leading-5 text-slate-400">
          These matches reflect recorded skill coverage, not a prediction of hiring or placement outcomes.
        </p>
      </div>
    </DashboardLayout>
  )
}
