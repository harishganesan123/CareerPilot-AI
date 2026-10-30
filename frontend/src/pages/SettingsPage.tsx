import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { fetchUserSettings, updateUserSettings, type UserSettings } from '../api/settings'
import { toApiError } from '../api/client'
import { useToast } from '../context/ToastContext'

export default function SettingsPage() {
  const { notifySuccess, notifyError } = useToast()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  async function loadSettings() {
    setIsLoading(true)
    setPageError(null)
    try {
      const result = await fetchUserSettings()
      setSettings(result)
      setFullName(result.full_name)
    } catch (error) {
      setPageError(toApiError(error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = fullName.trim()
    if (!name) {
      setPageError('Please enter your full name.')
      return
    }

    setIsSaving(true)
    setPageError(null)
    try {
      const updated = await updateUserSettings({ full_name: name })
      setSettings(updated)
      setFullName(updated.full_name)
      notifySuccess('Settings saved successfully.')
    } catch (error) {
      const message = toApiError(error).message
      setPageError(message)
      notifyError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <SettingsIcon size={14} />
                Account
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage your settings.</h1>
              <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                Keep your account details up to date so your CareerPilot AI workspace reflects you.
              </p>
            </div>
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
              <UserRound size={38} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        {pageError && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Settings need attention</p>
              <p className="mt-1">{pageError}</p>
              {!isLoading && !settings && (
                <button type="button" onClick={() => void loadSettings()} className="mt-2 font-semibold underline">Try loading again</button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader2 size={19} className="animate-spin text-blue-700" />
            Loading account settings…
          </div>
        ) : settings && (
          <>
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Basic account details</h2>
                <p className="mt-1 text-sm text-slate-500">Update the name associated with your profile.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="settings-name" className="block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  id="settings-name"
                  name="full_name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="settings-email" className="block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={settings.email ?? ''}
                  readOnly
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
                />
                <p className="text-xs text-slate-500">Email is read-only in this version.</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-400">Changes apply when you save.</p>
                <button type="submit" disabled={isSaving || !fullName.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Saving…' : 'Save settings'}
                </button>
              </div>
            </form>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={19} className="text-blue-700" />
                <h2 className="text-lg font-semibold text-slate-900">CareerPilot AI shortcuts</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">Jump back into your career workspace.</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Shortcut to="/profile" label="My profile" />
                <Shortcut to="/career-goals" label="Career goals" />
                <Shortcut to="/ai/career-recommendations" label="Career recommendations" />
                <Shortcut to="/placement/readiness" label="Placement readiness" />
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function Shortcut({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#96CAD3] hover:bg-[#F8FBFC] hover:text-[#1D3F5A]">
      {label}
      <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
