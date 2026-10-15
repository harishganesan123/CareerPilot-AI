import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarDays, Loader2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import SelectField from '../components/SelectField'
import {
  createCareerGoal,
  deleteCareerGoal,
  fetchCareerGoals,
  updateCareerGoal,
} from '../api/career'
import { toApiError } from '../api/client'
import type { ApiError } from '../api/client'
import { useToast } from '../context/ToastContext'
import { ROLE_PRIORITIES, type CareerGoal, type RolePriority } from '../types/career'

export default function CareerGoalsPage() {
  const { notifySuccess, notifyError } = useToast()

  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CareerGoal | null>(null)
  const [roleName, setRoleName] = useState('')
  const [priority, setPriority] = useState<RolePriority>('Primary')
  const [targetDate, setTargetDate] = useState('')
  const [roleError, setRoleError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<CareerGoal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setIsLoading(true)
    setLoadError(null)
    try {
      setGoals(await fetchCareerGoals())
    } catch (err) {
      setLoadError((toApiError(err) as ApiError).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const primary = useMemo(() => goals.filter((g) => g.priority === 'Primary'), [goals])
  const secondary = useMemo(() => goals.filter((g) => g.priority === 'Secondary'), [goals])

  function openAdd() {
    setEditing(null)
    setRoleName('')
    setPriority('Primary')
    setTargetDate('')
    setRoleError(undefined)
    setModalOpen(true)
  }

  function openEdit(goal: CareerGoal) {
    setEditing(goal)
    setRoleName(goal.role_name)
    setPriority(goal.priority)
    setTargetDate(goal.target_date || '')
    setRoleError(undefined)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!roleName.trim()) {
      setRoleError('Target role is required.')
      return
    }
    setRoleError(undefined)
    setIsSaving(true)

    try {
      const payload = {
        role_name: roleName.trim(),
        priority,
        target_date: targetDate || null,
      }
      if (editing) {
        const updated = await updateCareerGoal(editing.id, payload)
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
        notifySuccess('Career goal updated.')
      } else {
        const created = await createCareerGoal(payload)
        setGoals((prev) => [...prev, created])
        notifySuccess('Career goal added.')
      }
      setModalOpen(false)
    } catch (err) {
      notifyError((toApiError(err) as ApiError).message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      await deleteCareerGoal(pendingDelete.id)
      setGoals((prev) => prev.filter((g) => g.id !== pendingDelete.id))
      notifySuccess('Career goal deleted.')
      setPendingDelete(null)
    } catch (err) {
      notifyError((toApiError(err) as ApiError).message)
    } finally {
      setIsDeleting(false)
    }
  }

  function renderGroup(title: string, list: CareerGoal[], accent: string) {
    if (list.length === 0) return null
    return (
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((goal) => (
            <div
              key={goal.id}
              className={`rounded-xl border-l-4 ${accent} border-y border-r border-slate-200 bg-white p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{goal.role_name}</h3>
                  {goal.target_date && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <CalendarDays size={12} />
                      Target: {goal.target_date}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(goal)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Edit ${goal.role_name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(goal)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${goal.role_name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <DashboardLayout title="Career Goals">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Define the roles you're working toward. Later AI modules will use these to
          tailor recommendations.
        </p>
        {goals.length > 0 && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
          >
            <Plus size={16} />
            Add Target Role
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading career goals…
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No career goals set yet"
          description="Add your first target role to start building your Career Profile."
          actionLabel="+ Add Target Role"
          onAction={openAdd}
        />
      ) : (
        <>
          {renderGroup('Primary', primary, 'border-l-[var(--color-brand-500)]')}
          {renderGroup('Secondary', secondary, 'border-l-slate-300')}
        </>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit target role' : 'Add target role'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="goalRole"
            label="Target role"
            type="text"
            placeholder="e.g. Generative AI Engineer"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            error={roleError}
          />
          <SelectField
            id="goalPriority"
            label="Priority"
            options={ROLE_PRIORITIES}
            value={priority}
            onChange={(e) => setPriority(e.target.value as RolePriority)}
          />
          <FormField
            id="goalDate"
            label="Target date (optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              {editing ? 'Save changes' : 'Add target role'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete career goal"
        message={`Delete "${pendingDelete?.role_name}"? This can't be undone.`}
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}
