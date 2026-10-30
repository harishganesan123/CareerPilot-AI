import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import {
  fetchPlacementReadiness,
  type PlacementReadinessResponse,
} from '../api/placementReadiness'
import { toApiError } from '../api/client'

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export default function PlacementReadinessPage() {
  const [data, setData] = useState<PlacementReadinessResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  async function loadReadiness(refresh = false) {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    setPageError(null)
    try {
      setData(await fetchPlacementReadiness())
    } catch (error) {
      setPageError(toApiError(error).message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadReadiness()
  }, [])

  return (
    <DashboardLayout title="Placement Readiness">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <Compass size={14} />
                Career development
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Understand your placement readiness.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Review your current skill coverage, recognize strengths, and choose practical next steps.
              </p>
            </div>
            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 md:flex">
              <Award size={44} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your readiness overview</h2>
            <p className="mt-1 text-sm text-slate-500">Use this score as a guide for your next learning priorities.</p>
          </div>
          <button type="button" onClick={() => void loadReadiness(true)} disabled={isLoading || isRefreshing} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto">
            {isRefreshing || isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isRefreshing ? 'Refreshing…' : 'Refresh score'}
          </button>
        </div>

        {pageError && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to calculate placement readiness</p>
              <p className="mt-1">{pageError}</p>
              <button type="button" onClick={() => void loadReadiness()} className="mt-2 font-semibold underline">Try again</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 size={19} className="animate-spin text-blue-700" />
            Calculating placement readiness…
          </div>
        ) : !pageError && data && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Readiness score</p>
                  <Activity size={19} className="text-blue-700" />
                </div>
                <p className="mt-4 text-5xl font-bold tracking-tight text-[#1D3F5A]">
                  {clampScore(data.overall_score)}<span className="ml-1 text-2xl text-[#437B98]">%</span>
                </p>
                <span className="mt-3 inline-flex rounded-full bg-[#F0F7FA] px-3 py-1.5 text-sm font-semibold text-[#1D3F5A]">{data.readiness_level}</span>
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1D3F5A] to-[#96CAD3] transition-all" style={{ width: `${clampScore(data.overall_score)}%` }} />
                </div>
                {data.target_role && <p className="mt-4 text-sm text-slate-500">Target role: <span className="font-semibold text-slate-800">{data.target_role}</span></p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h2 className="text-lg font-semibold text-slate-900">What this score measures</h2>
                <p className="mt-1 text-sm text-slate-500">A breakdown of the configured readiness factors.</p>
                <div className="mt-5 space-y-5">
                  {data.factors.map((factor) => (
                    <div key={factor.name}>
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-semibold text-slate-800">{factor.name}</span>
                        <span className="text-slate-500">{clampScore(factor.score)}% · {factor.status}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#437B98]" style={{ width: `${clampScore(factor.score)}%` }} />
                      </div>
                      <p className="mt-1.5 text-sm leading-5 text-slate-500">{factor.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><CheckCircle2 size={19} className="text-emerald-600" /> Strengths</h2>
                {data.strengths.length ? (
                  <ul className="mt-4 space-y-3">
                    {data.strengths.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" />{item}</li>)}
                  </ul>
                ) : <p className="mt-4 text-sm text-slate-500">Continue building your profile to identify strengths.</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Target size={19} className="text-amber-600" /> Areas to improve</h2>
                {data.improvement_areas.length ? (
                  <ul className="mt-4 space-y-3">
                    {data.improvement_areas.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><TrendingUp size={16} className="mt-1 shrink-0 text-amber-600" />{item}</li>)}
                  </ul>
                ) : <p className="mt-4 text-sm text-slate-500">No specific improvement areas were returned.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2"><TrendingUp size={19} className="text-blue-700" /><h2 className="text-lg font-semibold text-slate-900">Recommended next actions</h2></div>
              {data.recommended_actions.length ? (
                <ol className="mt-4 space-y-3">
                  {data.recommended_actions.map((item, index) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0F7FA] text-xs font-bold text-[#1D3F5A]">{index + 1}</span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-3 text-sm text-slate-500">No next actions were returned.</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/ai/skill-gap" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]">Review skill gaps <ArrowRight size={15} /></Link>
                <Link to="/ai/career-recommendations" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Career recommendations</Link>
                <Link to="/placement/interview-prep" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Practise mock interview</Link>
              </div>
            </section>
            <p className="text-xs leading-5 text-slate-400">{data.disclaimer}</p>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
