import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Target } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import FormField from '../components/FormField'
import { fetchProfile, updateProfile } from '../api/users'
import { fetchCareerGoals } from '../api/career'
import { toApiError } from '../api/client'
import type { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { CareerGoal } from '../types/career'

interface EditableFields {
  name: string
  programme: string
  university: string
  semester: string
  careerGoal: string
  bio: string
}

const emptyFields: EditableFields = {
  name: '',
  programme: '',
  university: '',
  semester: '',
  careerGoal: '',
  bio: '',
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export default function ProfilePage() {
  const { setUser } = useAuth()
  const { notifySuccess, notifyError } = useToast()

  const [email, setEmail] = useState('')
  const [fields, setFields] = useState<EditableFields>(emptyFields)
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | undefined>()

  async function load() {
    setIsLoading(true)
    setLoadError(null)
    try {
      const [profile, careerGoals] = await Promise.all([
        fetchProfile(),
        fetchCareerGoals(),
      ])
      setEmail(profile.email)
      setFields({
        name: profile.name,
        programme: profile.programme || '',
        university: profile.university || '',
        semester: profile.semester ? String(profile.semester) : '',
        careerGoal: profile.career_goal || '',
        bio: profile.bio || '',
      })
      setGoals(careerGoals)
    } catch (err) {
      setLoadError((toApiError(err) as ApiError).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function updateField<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (fields.name.trim().length < 2) {
      setNameError('Name must be at least 2 characters.')
      return
    }
    setNameError(undefined)
    setIsSaving(true)

    try {
      const updated = await updateProfile({
        name: fields.name.trim(),
        programme: fields.programme.trim() || undefined,
        university: fields.university.trim() || undefined,
        semester: fields.semester ? Number(fields.semester) : undefined,
        career_goal: fields.careerGoal.trim() || undefined,
        bio: fields.bio.trim() || undefined,
      })
      setUser(updated)
      notifySuccess('Profile updated successfully.')
    } catch (err) {
      notifyError((toApiError(err) as ApiError).message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading profile…
        </div>
      </DashboardLayout>
    )
  }

  if (loadError) {
    return (
      <DashboardLayout title="My Profile">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Profile">
      <form className="max-w-3xl space-y-6" onSubmit={handleSubmit} noValidate>
        <Section
          title="Personal Information"
          description="Your email is used to sign in and can't be changed in this phase."
        >
          <FormField
            id="name"
            label="Name"
            type="text"
            value={fields.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={nameError}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
          />
        </Section>

        <Section title="Academic Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="programme"
              label="Programme"
              type="text"
              placeholder="e.g. B.Tech Artificial Intelligence"
              value={fields.programme}
              onChange={(e) => updateField('programme', e.target.value)}
            />
            <FormField
              id="semester"
              label="Semester"
              type="number"
              min={1}
              max={12}
              value={fields.semester}
              onChange={(e) => updateField('semester', e.target.value)}
            />
          </div>
          <FormField
            id="university"
            label="University"
            type="text"
            value={fields.university}
            onChange={(e) => updateField('university', e.target.value)}
          />
        </Section>

        <Section
          title="Career Information"
          description="Your headline career goal, plus the target roles you manage on the Career Goals page."
        >
          <FormField
            id="careerGoal"
            label="Career goal"
            type="text"
            placeholder="e.g. Generative AI Engineer"
            value={fields.careerGoal}
            onChange={(e) => updateField('careerGoal', e.target.value)}
          />

          <div>
            <p className="text-sm font-medium text-slate-700">Target roles</p>
            {goals.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No target roles yet.{' '}
                <Link
                  to="/career-goals"
                  className="font-medium text-[var(--color-brand-600)] hover:underline"
                >
                  Add one
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {goals.map((goal) => (
                  <li
                    key={goal.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    <Target size={14} className="text-slate-400" />
                    <span className="text-slate-800">{goal.role_name}</span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        goal.priority === 'Primary'
                          ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {goal.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section title="About">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              placeholder="A short introduction about yourself."
              value={fields.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
            />
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-md bg-[var(--color-brand-500)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
}
