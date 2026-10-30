import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mic2, RotateCcw, Sparkles } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { toApiError } from '../api/client'
import { evaluateInterviewAnswer, fetchMockInterviewOptions, generateInterviewQuestions, summarizeMockInterview } from '../api/mockInterview'
import type { AnswerEvaluation, InterviewAnswerRecord, InterviewDifficulty, InterviewOptions, InterviewQuestion, InterviewSummary, InterviewType } from '../api/mockInterview'

const field = 'mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
type Phase = 'setup' | 'answer' | 'review' | 'summary'

export default function MockInterviewPage() {
  const [options, setOptions] = useState<InterviewOptions | null>(null)
  const [role, setRole] = useState('')
  const [type, setType] = useState<InterviewType>('mixed')
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('intermediate')
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [records, setRecords] = useState<InterviewAnswerRecord[]>([])
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null)
  const [summary, setSummary] = useState<InterviewSummary | null>(null)
  const [phase, setPhase] = useState<Phase>('setup')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchMockInterviewOptions().then((value) => { setOptions(value); if (value.roles.length) setRole(value.roles[0]) }).catch((e) => setError(toApiError(e).message)) }, [])
  const current = questions[index]

  async function start() {
    setBusy(true); setError('')
    try {
      const result = await generateInterviewQuestions({ role, interview_type: type, difficulty, question_count: count })
      setQuestions(result.questions); setIndex(0); setRecords([]); setAnswer(''); setEvaluation(null); setSummary(null); setPhase('answer')
    } catch (e) { setError(toApiError(e).message) } finally { setBusy(false) }
  }

  async function submitAnswer() {
    if (!current || answer.trim().length < 10) return
    setBusy(true); setError('')
    try {
      setEvaluation(await evaluateInterviewAnswer({ role, interview_type: type, difficulty, question: current.question, answer: answer.trim() }))
      setPhase('review')
    } catch (e) { setError(toApiError(e).message) } finally { setBusy(false) }
  }

  async function nextQuestion() {
    if (!current || !evaluation) return
    const next = [...records, { question: current.question, answer: answer.trim(), score: evaluation.score, feedback_summary: `${evaluation.rating}: ${evaluation.concise_tip}` }]
    setRecords(next)
    if (index + 1 < questions.length) { setIndex(index + 1); setAnswer(''); setEvaluation(null); setPhase('answer'); return }
    setBusy(true); setError('')
    try { setSummary(await summarizeMockInterview({ role, interview_type: type, difficulty, answers: next })); setPhase('summary') }
    catch (e) { setError(toApiError(e).message); setRecords(next) } finally { setBusy(false) }
  }

  function reset() { setQuestions([]); setIndex(0); setAnswer(''); setRecords([]); setEvaluation(null); setSummary(null); setPhase('setup'); setError('') }

  return <DashboardLayout title="Mock Interview"><div className="mx-auto max-w-5xl space-y-6">
    <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8"><div className="flex items-center gap-3"><Mic2 size={34}/><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Placement preparation</p><h2 className="mt-1 text-2xl font-bold">Practise with an AI interviewer</h2><p className="mt-2 text-sm leading-6 text-blue-100">Choose a role, answer questions, and receive constructive feedback for each response.</p></div></div></section>
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18}/>{error}</div>}
    {phase === 'setup' && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="text-lg font-semibold">Set up your interview</h3><p className="mt-1 text-sm text-slate-500">Session answers are held in page memory and are not saved to the database.</p></div><div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Target role<select className={field} value={role} onChange={e=>setRole(e.target.value)} disabled={!options}>{(options?.roles ?? []).map(r=><option key={r}>{r}</option>)}</select></label>
      <label className="text-sm font-medium">Interview type<select className={field} value={type} onChange={e=>setType(e.target.value as InterviewType)}><option value="mixed">Mixed</option><option value="technical">Technical</option><option value="behavioral">Behavioural</option></select></label>
      <label className="text-sm font-medium">Difficulty<select className={field} value={difficulty} onChange={e=>setDifficulty(e.target.value as InterviewDifficulty)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
      <label className="text-sm font-medium">Questions<select className={field} value={count} onChange={e=>setCount(Number(e.target.value))}><option value={3}>3 · Quick</option><option value={5}>5 · Standard</option><option value={8}>8 · Extended</option></select></label>
    </div><button onClick={()=>void start()} disabled={!options || busy || !role} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy?<Loader2 className="animate-spin" size={17}/>:<Sparkles size={17}/>}Start mock interview</button></section>}
    {(phase === 'answer' || phase === 'review') && current && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-blue-700">{role} · {difficulty}</p><h3 className="mt-1 text-lg font-semibold">Question {index+1} of {questions.length}</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{current.topic}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{width:`${(index+1)/questions.length*100}%`}}/></div><p className="rounded-xl bg-slate-50 p-4 text-base font-medium leading-7">{current.question}</p><div><p className="text-xs font-semibold uppercase text-slate-500">Consider covering</p><div className="mt-2 flex flex-wrap gap-2">{current.what_to_cover.map(x=><span key={x} className="rounded-full border px-3 py-1 text-xs text-slate-600">{x}</span>)}</div></div><label className="block text-sm font-medium">Your answer<textarea className="mt-2 min-h-36 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6" value={answer} maxLength={4000} disabled={phase==='review'} onChange={e=>setAnswer(e.target.value)} placeholder="Explain your answer clearly. For behavioural questions, consider using STAR…"/><span className="mt-1 block text-right text-xs text-slate-400">{answer.length}/4000</span></label>
      {phase==='review' && evaluation && <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase text-blue-700">Answer feedback</p><p className="mt-1 text-lg font-bold">{evaluation.rating}</p></div><p className="text-3xl font-bold text-blue-700">{evaluation.score}<span className="text-sm text-slate-400">/100</span></p></div><Feedback title="Strengths" items={evaluation.strengths}/><Feedback title="Improvements" items={evaluation.improvements}/><div><h4 className="text-sm font-semibold">Example improved answer</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{evaluation.suggested_answer}</p></div><p className="rounded-lg bg-white p-3 text-sm"><strong>Tip:</strong> {evaluation.concise_tip}</p></div>}
      <div className="flex flex-wrap justify-between gap-3"><button onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm"><RotateCcw size={15}/>End session</button>{phase==='answer'?<button onClick={()=>void submitAnswer()} disabled={busy || answer.trim().length<10} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy&&<Loader2 size={16} className="animate-spin"/>}Submit answer</button>:<button onClick={()=>void nextQuestion()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy&&<Loader2 size={16} className="animate-spin"/>}{index+1===questions.length?'Finish interview':'Next question'}<ArrowRight size={16}/></button>}</div>
    </section>}
    {phase==='summary' && summary && <div className="space-y-5"><section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-blue-700">Session complete</p><h3 className="mt-1 text-2xl font-bold">{summary.performance_level}</h3><p className="mt-1 text-sm text-slate-500">{role} · {questions.length} questions</p></div><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-8 border-blue-100 bg-blue-50"><span className="text-2xl font-bold text-blue-800">{summary.overall_score}</span><span className="text-xs text-slate-500">/100</span></div></div><p className="mt-5 text-sm leading-6 text-slate-600">{summary.closing_note}</p><div className="mt-5 grid gap-5 md:grid-cols-2"><Feedback title="Key strengths" items={summary.key_strengths}/><Feedback title="Priority improvements" items={summary.priority_improvements}/></div></section><section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-lg font-semibold">Practice plan</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">{summary.practice_plan.map((x,i)=><li key={`${i}-${x}`}>{x}</li>)}</ol></section><section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-lg font-semibold">Answer scorecard</h3>{records.map((r,i)=><div key={`${i}-${r.question}`} className="flex justify-between gap-4 border-b py-3"><div><p className="text-sm font-medium">{i+1}. {r.question}</p><p className="mt-1 text-xs text-slate-500">{r.feedback_summary}</p></div><strong className="shrink-0 text-blue-700">{r.score}/100</strong></div>)}</section><button onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white"><RotateCcw size={16}/>Start another interview</button></div>}
  </div></DashboardLayout>
}
function Feedback({title,items}:{title:string;items:string[]}) { return <div><h4 className="text-sm font-semibold">{title}</h4>{items.length?<ul className="mt-2 space-y-2">{items.map((x,i)=><li key={`${title}-${i}`} className="flex gap-2 text-sm leading-5 text-slate-600"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-blue-600"/>{x}</li>)}</ul>:<p className="mt-2 text-sm text-slate-400">None identified.</p>}</div> }
