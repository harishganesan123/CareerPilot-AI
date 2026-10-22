import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Compass,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { analyzeSkillGap, fetchCareerRoles } from '../api/skillGap'
import type {
  CareerRoleOption,
  SkillGapResult,
} from '../api/skillGap'
import { toApiError } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function SkillGapPage() {
  const { notifyError } = useToast()

  const [roles, setRoles] = useState<CareerRoleOption[]>([])
  const [selectedRole, setSelectedRole] = useState('AI Engineer')
  const [result, setResult] = useState<SkillGapResult | null>(null)
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoles() {
      try {
        const availableRoles = await fetchCareerRoles()
        setRoles(availableRoles)

        if (
          availableRoles.length > 0 &&
          !availableRoles.some((role) => role.role_name === selectedRole)
        ) {
          setSelectedRole(availableRoles[0].role_name)
        }
      } catch (error) {
        setPageError(toApiError(error).message)
      } finally {
        setIsLoadingRoles(false)
      }
    }

    loadRoles()
  }, [])

  async function handleAnalyze() {
    setIsAnalyzing(true)
    setPageError(null)

    try {
      const analysis = await analyzeSkillGap(selectedRole)
      setResult(analysis)
    } catch (error) {
      const message = toApiError(error).message
      setPageError(message)
      notifyError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const scoreColor =
    result && result.readiness_score >= 80
      ? 'text-emerald-600'
      : result && result.readiness_score >= 50
        ? 'text-amber-600'
        : 'text-blue-700'

  return (
    <DashboardLayout title="Skill Gap Analysis">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <Compass size={14} />
                Career development
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Find your skill gaps.
                <br />
                Build your career roadmap.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Compare the skills in your profile with the requirements of
                your target role and identify what to learn next.
              </p>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 md:flex">
              <Target size={46} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Choose your target role
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your analysis is based on the skills saved in your profile.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Target career role"
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value)
                setResult(null)
                setPageError(null)
              }}
              disabled={isLoadingRoles || roles.length === 0}
              className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              {roles.length === 0 && (
                <option value="">No roles available</option>
              )}
              {roles.map((role) => (
                <option key={role.role_name} value={role.role_name}>
                  {role.role_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoadingRoles || isAnalyzing || roles.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingRoles || isAnalyzing ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <TrendingUp size={17} />
              )}
              {isAnalyzing ? 'Analyzing…' : 'Analyze my skills'}
            </button>
          </div>

          {roles.length > 0 && selectedRole && (
            <p className="mt-3 text-xs text-slate-500">
              {roles.find((role) => role.role_name === selectedRole)?.description}
            </p>
          )}
        </section>

        {pageError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load the analysis</p>
              <p className="mt-1">{pageError}</p>
              <button
                type="button"
                onClick={handleAnalyze}
                className="mt-2 inline-flex items-center gap-1 font-semibold underline"
              >
                <RefreshCw size={13} />
                Try again
              </button>
            </div>
          </div>
        )}

        {isLoadingRoles && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            <Loader2 size={17} className="animate-spin" />
            Loading career roles…
          </div>
        )}

        {!result && !isLoadingRoles && !pageError && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Target size={27} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Your career analysis starts here
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Select a role and analyze your skills to see your current skill
              coverage, missing requirements, and suggested learning priorities.
            </p>
          </section>
        )}

        {result && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Skill coverage
                  </p>
                  <TrendingUp size={19} className="text-blue-600" />
                </div>
                <div className={`mt-3 text-4xl font-bold ${scoreColor}`}>
                  {result.readiness_score}%
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, result.readiness_score))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Recorded requirements matched
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Matched skills
                  </p>
                  <CheckCircle2 size={19} className="text-emerald-600" />
                </div>
                <div className="mt-3 text-4xl font-bold text-slate-900">
                  {result.matched_count}
                  <span className="ml-2 text-base font-medium text-slate-400">
                    / {result.total_required_skills}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Requirements found in your profile
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Skills to develop
                  </p>
                  <Target size={19} className="text-amber-600" />
                </div>
                <div className="mt-3 text-4xl font-bold text-slate-900">
                  {result.missing_count}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Listed role requirements not yet recorded
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Your analysis
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {result.role_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {result.description}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                  {result.readiness_level}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Matched skills
                  </h3>

                  {result.matched_skills.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                      No required skills match your current profile yet. Add
                      your existing skills on the Skills page and try again.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {result.matched_skills.map((skill) => (
                        <div
                          key={skill.skill_name}
                          className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-800">
                              {skill.skill_name}
                            </span>
                            <span className="text-xs font-semibold text-emerald-700">
                              {skill.proficiency}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{
                                width: `${skill.proficiency_percent}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Target size={18} className="text-amber-600" />
                    Missing skills
                  </h3>

                  {result.missing_skills.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                      All listed role requirements are represented in your
                      profile.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.missing_skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <TrendingUp size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    Recommended next skills
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Start with these priorities from the role requirements.
                  </p>

                  {result.recommended_next_skills.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-600">
                      No additional skills are suggested by this initial
                      analysis. Continue practicing and building projects.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {result.recommended_next_skills.map((skill, index) => (
                        <div
                          key={skill}
                          className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm font-semibold text-slate-800">
                            {skill}
                          </span>
                          <ArrowRight size={17} className="text-blue-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
              <CircleHelp size={17} className="mt-0.5 shrink-0" />
              <p>{result.score_note}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Refresh analysis
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
