import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Loader2 } from 'lucide-react'
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

    if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.'

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-500)] text-white">
            <Compass size={18} />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start your CareerPilot AI journey</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <FormField
            id="name"
            label="Full name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
          />

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

          <div className="grid grid-cols-2 gap-4">
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
              placeholder="7"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              error={fieldErrors.semester}
            />
          </div>

          <FormField
            id="university"
            label="University"
            type="text"
            placeholder="Your university"
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
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--color-brand-600)]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
