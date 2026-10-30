
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  GraduationCap,
  Target,
  TrendingUp,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import FormField from '../components/FormField'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/AuthContext'
import type { ApiError } from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {}

    if (!email.trim()) errors.email = 'Email is required.'
    if (!password) errors.password = 'Password is required.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })

      const state = location.state as {
        from?: { pathname?: string }
      } | null

      const redirectTo = state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError((error as ApiError).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F2F1] lg:grid lg:grid-cols-2">

      {/* LEFT BRAND PANEL */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#1D3F5A] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">

        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full border border-white/10" />
        <div className="absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full border border-white/10" />
        <div className="absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full bg-[#437B98]/20 blur-3xl" />

        <div className="relative z-10">
          <img
            src="/careerpilot-logo.png"
            alt="CareerPilot AI"
            className="h-auto w-72 rounded-md object-contain"
          />
        </div>

        <div className="relative z-10 max-w-xl py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#96CAD3]/30 bg-white/10 px-4 py-2 text-sm text-[#D6EAF0]">
            <BrainCircuit size={17} />
            AI-powered career guidance
          </div>

          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Your career journey,
            <span className="block text-[#96CAD3]">
              smarter with AI.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-200">
            Plan your learning, discover your strengths, identify skill gaps
            and prepare for your dream career with intelligent guidance.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 text-[#96CAD3]">
                <Target size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Smart Skill Analysis</h3>
                <p className="text-sm text-slate-300">
                  Understand your strengths and skill gaps.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 text-[#96CAD3]">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Personalized Learning</h3>
                <p className="text-sm text-slate-300">
                  Build a learning plan around your goals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 text-[#96CAD3]">
                <BriefcaseBusiness size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Career Opportunities</h3>
                <p className="text-sm text-slate-300">
                  Discover roles that match your skills.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-sm text-slate-300">
          <span>PLAN · PREPARE · PROGRESS</span>
          <span>CareerPilot AI © 2026</span>
        </div>
      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <img
              src="/careerpilot-logo.png"
              alt="CareerPilot AI"
              className="w-64 object-contain"
            />
          </div>

          <div className="rounded-3xl border border-[#D6EAF0] bg-white p-7 shadow-[0_15px_50px_rgba(29,63,90,0.08)] sm:p-10">

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4F6] text-[#437B98]">
                <TrendingUp size={25} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#0F1F2E]">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B7C93]">
                Sign in to continue building your future with CareerPilot AI.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {serverError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <FormField
                id="email"
                label="Email address"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                autoComplete="email"
              />

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F1F2E]">
                    Password
                  </span>
                </div>

                <PasswordField
                  id="password"
                  label=""
                  value={password}
                  onChange={setPassword}
                  error={fieldErrors.password}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D3F5A] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1D3F5A]/15 transition hover:bg-[#437B98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-[#6B7C93]">NEW TO CAREERPILOT?</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              to="/register"
              className="flex w-full items-center justify-center rounded-xl border border-[#96CAD3] px-5 py-3 text-sm font-semibold text-[#1D3F5A] transition hover:bg-[#EAF4F6]"
            >
              Create your account
            </Link>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[#6B7C93]">
              <ShieldCheck size={15} className="text-[#437B98]" />
              Your learning and career journey starts here.
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#6B7C93]">
            © 2026 CareerPilot AI. Plan · Prepare · Progress.
          </p>
        </div>
      </section>
    </main>
  )
}
