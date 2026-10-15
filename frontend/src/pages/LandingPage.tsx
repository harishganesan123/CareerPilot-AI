import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  FileSearch,
  Sparkles,
  Target,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import FeatureCard from '../components/FeatureCard'
import { getHealth } from '../api/health'

const features = [
  {
    icon: BrainCircuit,
    title: 'AI Academic Assistant',
    description:
      'Chat with your study materials and get contextual, AI-generated explanations grounded in your own notes.',
  },
  {
    icon: CalendarClock,
    title: 'Smart Study Planner',
    description:
      'Generate personalized, adaptive study schedules based on your semester, workload, and goals.',
  },
  {
    icon: FileSearch,
    title: 'Resume Analysis',
    description:
      'Get structured, AI-driven feedback on your resume with actionable, role-specific improvements.',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description:
      'Compare your current skill set against target roles and see exactly what to learn next.',
  },
  {
    icon: Sparkles,
    title: 'Career Recommendations',
    description:
      'Receive tailored career paths and role suggestions based on your profile and interests.',
  },
  {
    icon: BookOpenCheck,
    title: 'Placement Preparation',
    description:
      'Practice for interviews and placements with structured, AI-assisted preparation tracks.',
  },
]

type BackendStatus = 'checking' | 'online' | 'offline'

export default function LandingPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<BackendStatus>('checking')

  useEffect(() => {
    let mounted = true
    getHealth()
      .then(() => {
        if (mounted) setStatus('online')
      })
      .catch(() => {
        if (mounted) setStatus('offline')
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === 'online'
                    ? 'bg-emerald-500'
                    : status === 'offline'
                      ? 'bg-red-400'
                      : 'bg-amber-400'
                }`}
              />
              Backend {status === 'checking' ? 'checking…' : status}
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Your AI-Powered Academic &amp; Career Copilot
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              CareerPilot AI helps students learn smarter, plan their studies, identify skill
              gaps, and prepare confidently for careers &mdash; all in one intelligent platform.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="rounded-md bg-[var(--color-brand-500)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-brand-600)]"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Login
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                Everything a student needs, in one platform
              </h2>
              <p className="mt-3 text-slate-600">
                From daily study support to placement readiness, CareerPilot AI keeps your
                academic and career journey organized.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
