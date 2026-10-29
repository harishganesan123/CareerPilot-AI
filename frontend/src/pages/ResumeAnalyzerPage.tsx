import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, FileSearch, Loader2, UploadCloud } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { analyzeResume, fetchResumeRoles } from '../api/resumeAnalyzer'
import type { ResumeAnalysis } from '../api/resumeAnalyzer'
import { toApiError } from '../api/client'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['.pdf', '.docx', '.txt']

const labels: Record<string, string> = {
  sections_and_structure: 'Sections and structure',
  role_keyword_coverage: 'Target-role keyword coverage',
  action_verbs: 'Action verbs',
  quantified_evidence: 'Quantified evidence',
}

export default function ResumeAnalyzerPage() {
  const [roles, setRoles] = useState<string[]>([])
  const [role, setRole] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ResumeAnalysis | null>(null)
  const [error, setError] = useState('')
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchResumeRoles()
      .then((available) => {
        setRoles(available)
        if (available.length) setRole(available[0])
      })
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setLoadingRoles(false))
  }, [])

  function chooseFile(next: File | null) {
    setError('')
    setResult(null)
    if (!next) {
      setFile(null)
      return
    }
    const ext = `.${next.name.split('.').pop()?.toLowerCase() || ''}`
    if (!ACCEPTED.includes(ext)) {
      setFile(null)
      setError('Choose a PDF, DOCX, or TXT file.')
      return
    }
    if (next.size > MAX_BYTES) {
      setFile(null)
      setError('The file must be 5 MB or smaller.')
      return
    }
    setFile(next)
  }

  async function submit() {
    if (!file || !role || analyzing) return
    setAnalyzing(true)
    setError('')
    setResult(null)
    try {
      setResult(await analyzeResume(file, role))
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <DashboardLayout title="Resume Analyzer">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <FileSearch size={34} />
            <div>
              <h2 className="text-2xl font-bold">Resume Analyzer</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
                Get role-specific resume feedback, a transparent heuristic score, and actionable improvements.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-800">
            Target career role
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"
              value={role}
              onChange={(e) => { setRole(e.target.value); setResult(null) }}
              disabled={loadingRoles || roles.length === 0}
            >
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50">
            <UploadCloud size={28} className="text-blue-700" />
            <span className="mt-2 text-sm font-semibold text-slate-800">
              {file ? file.name : 'Choose your resume'}
            </span>
            <span className="mt-1 text-xs text-slate-500">PDF, DOCX, or TXT · maximum 5 MB</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="sr-only"
              onChange={(e) => chooseFile(e.target.files?.[0] || null)}
            />
          </label>

          <p className="text-xs leading-5 text-slate-500">
            Resume text is processed for this request and is not saved by this feature. Contact details and URLs are redacted before AI feedback is requested. Do not upload documents you are not authorized to share.
          </p>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!file || !role || analyzing || loadingRoles}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? <><Loader2 size={17} className="animate-spin" /> Analyzing resume…</> : 'Analyze resume'}
          </button>
        </section>

        {result && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Heuristic resume score</p>
                  <p className="mt-1 text-4xl font-bold text-slate-900">{result.ats_score}<span className="text-lg text-slate-400">/100</span></p>
                  <p className="mt-1 text-xs text-slate-500">Target role: {result.target_role}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                  {result.source === 'ai_generated' ? 'AI feedback' : 'Rule-based feedback'}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {Object.entries(result.score_breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600">
                      <span>{labels[key] || key}</span><span>{value} points</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, value / (key === 'sections_and_structure' ? 35 : key === 'role_keyword_coverage' ? 40 : key === 'action_verbs' ? 15 : 10) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">{result.score_note}</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">AI review</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.feedback.summary}</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FeedbackList title="Strengths" items={result.feedback.strengths} positive />
                <FeedbackList title="Improvements" items={result.feedback.improvements} />
                <FeedbackList title="Skills found" items={result.feedback.skills_found} positive />
                <FeedbackList title="Missing or unclear skills" items={result.feedback.missing_or_unclear_skills} />
                <FeedbackList title="ATS tips" items={result.feedback.ats_tips} />
                <FeedbackList title="Suggested bullet rewrites" items={result.feedback.bullet_rewrites} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Sections detected</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.detected_sections.map((section) => (
                  <span key={section} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={13} /> {section}
                  </span>
                ))}
                {result.detected_sections.length === 0 && <p className="text-sm text-slate-500">No common resume sections were detected.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function FeedbackList({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2 text-sm leading-5 text-slate-600">
              {positive && <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-slate-400">None identified.</p>}
    </div>
  )
}
