import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Loader2 } from 'lucide-react'
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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
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
      const state = location.state as { from?: { pathname?: string } } | null
      const redirectTo = state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError((error as ApiError).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-500)] text-white">
            <Compass size={18} />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to continue to CareerPilot AI</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-[var(--color-brand-600)]">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
