
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  GraduationCap,
  Target,
  BriefcaseBusiness,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import FormField from '../components/FormField'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../context/AuthContext'
import type { ApiError } from '../api/client'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  semester?: string
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [programme, setProgramme] = useState('')
  const [university, setUniversity] = useState('')
  const [semester, setSemester] = useState('')

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}

    if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.'
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Enter a valid email address.'
    }

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = 'Password must contain at least one letter and one number.'
    }

    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    if (semester && (Number(semester) < 1 || Number(semester) > 12)) {
      errors.semester = 'Semester must be between 1 and 12.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        programme: programme.trim() || undefined,
        university: university.trim() || undefined,
        semester: semester ? Number(semester) : undefined,
      })

      navigate('/dashboard', { replace: true })
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
            Start your career journey
          </div>

          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Build your future.
            <span className="block text-[#96CAD3]">
              One skill at a time.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-200">
            Create your student profile and let CareerPilot AI help you
            discover opportunities, develop skills and move closer to
            your career goals.
          </p>

          <div className="mt-10 space-y-5">

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 text-[#96CAD3]">
                <Target size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Discover your potential</h3>
                <p className="text-sm text-slate-300">
                  Identify strengths and areas to improve.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 text-[#96CAD3]">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Create your learning path</h3>
                <p className="text-sm text-slate-300">
                  Get guidance based on your academic profile.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/10 p-3 text-[#96CAD3]">
                <BriefcaseBusiness size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Prepare for opportunities</h3>
                <p className="text-sm text-slate-300">
                  Work towards your dream career.
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

      {/* RIGHT REGISTRATION PANEL */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:py-12">

        <div className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src="/careerpilot-logo.png"
              alt="CareerPilot AI"
              className="w-64 object-contain"
            />
          </div>

          <div className="rounded-3xl border border-[#D6EAF0] bg-white p-7 shadow-[0_15px_50px_rgba(29,63,90,0.08)] sm:p-9">

            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF4F6] text-[#437B98]">
                <GraduationCap size={25} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#0F1F2E]">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B7C93]">
                Join CareerPilot AI and start planning your future.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {serverError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <FormField
                id="name"
                label="Full name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                autoComplete="name"
              />

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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  id="programme"
                  label="Programme"
                  type="text"
                  placeholder="B.Tech AI"
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                />

                <FormField
                  id="semester"
                  label="Semester"
                  type="number"
                  min={1}
                  max={12}
                  placeholder="e.g. 7"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  error={fieldErrors.semester}
                />
              </div>

              <FormField
                id="university"
                label="University"
                type="text"
                placeholder="Enter your university"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                autoComplete="new-password"
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={fieldErrors.confirmPassword}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D3F5A] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1D3F5A]/15 transition hover:bg-[#437B98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create your account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 text-center text-sm text-[#6B7C93]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#437B98] hover:text-[#1D3F5A]"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#6B7C93]">
              <ShieldCheck size={15} className="text-[#437B98]" />
              Your information is used to personalize your experience.
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
