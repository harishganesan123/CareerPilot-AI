
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
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
      'Build personalized study schedules based on your semester, workload, deadlines, and goals.',
  },
  {
    icon: FileSearch,
    title: 'Resume Analysis',
    description:
      'Get structured feedback on your resume with actionable suggestions for your target role.',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description:
      'Compare your current skills against target roles and discover what to learn next.',
  },
  {
    icon: Sparkles,
    title: 'Career Recommendations',
    description:
      'Explore career paths and role suggestions aligned with your skills and interests.',
  },
  {
    icon: BookOpenCheck,
    title: 'Placement Preparation',
    description:
      'Prepare for interviews and placements with structured learning and practice tracks.',
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
    <div className="flex min-h-screen flex-col bg-[#F8FBFC]">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden border-b border-[#D6EAF0] bg-gradient-to-b from-white via-[#F8FBFC] to-[#EDF5F8]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[#D6EAF0]/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-[#96CAD3]/20 blur-3xl"
          />

          <div className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D6EAF0] bg-white/90 px-4 py-2 text-xs font-semibold tracking-wide text-[#1D3F5A] shadow-sm sm:text-sm">
                <Sparkles size={15} className="text-[#437B98]" />
                YOUR PERSONAL AI CAREER COMPANION
              </div>

              <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-[#0F1F2E] sm:text-5xl lg:text-6xl">
                Turn your ambitions into a{' '}
                <span className="bg-gradient-to-r from-[#1D3F5A] via-[#437B98] to-[#5AA8B8] bg-clip-text text-transparent">
                  career roadmap.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#43576A] sm:text-lg">
                Learn smarter, understand your skill gaps, plan your progress,
                and prepare for your dream role with CareerPilot AI — your
                academic and career journey in one place.
              </p>

              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D3F5A] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1D3F5A]/15 transition hover:-translate-y-0.5 hover:bg-[#437B98] focus:outline-none focus:ring-2 focus:ring-[#96CAD3] focus:ring-offset-2"
                >
                  Start your journey
                  <ArrowRight size={17} />
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center rounded-xl border border-[#C9DDE6] bg-white/80 px-7 py-3.5 text-sm font-semibold text-[#1D3F5A] transition hover:border-[#96CAD3] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#96CAD3] focus:ring-offset-2"
                >
                  Sign in to your account
                </button>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#D6EAF0] bg-white/80 px-3.5 py-2 text-xs text-[#43576A] shadow-sm sm:text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === 'online'
                      ? 'bg-emerald-500'
                      : status === 'offline'
                        ? 'bg-red-500'
                        : 'animate-pulse bg-amber-400'
                  }`}
                />
                Platform services:{' '}
                <span className="font-semibold text-[#1D3F5A]">
                  {status === 'checking'
                    ? 'Checking connection…'
                    : status === 'online'
                      ? 'Connected'
                      : 'Temporarily unavailable'}
                </span>
              </div>

              <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
                {[
                  {
                    icon: Target,
                    title: 'Know your skills',
                    text: 'Identify what to improve',
                  },
                  {
                    icon: CalendarClock,
                    title: 'Plan your progress',
                    text: 'Create a focused learning path',
                  },
                  {
                    icon: BrainCircuit,
                    title: 'Prepare with AI',
                    text: 'Practice with purpose',
                  },
                ].map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-[#DCE9EF] bg-white/80 p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF4F7] text-[#356780]">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1D3F5A]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#6B7C93]">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-24 bg-[#F8FBFC] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-[#EAF4F7] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#356780]">
                One connected platform
              </span>

              <h2
                id="about"
                className="mt-5 text-3xl font-bold tracking-tight text-[#0F1F2E] sm:text-4xl"
              >
                Everything you need to move forward
              </h2>

              <p className="mt-4 text-base leading-7 text-[#43576A] sm:text-lg">
                From everyday academic support to career preparation, bring
                your learning, planning, and professional development together.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D3F5A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#437B98] focus:outline-none focus:ring-2 focus:ring-[#96CAD3] focus:ring-offset-2"
              >
                Explore CareerPilot AI
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
