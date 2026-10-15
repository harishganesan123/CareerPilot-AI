import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import SelectField from '../components/SelectField'
import { createSkill, deleteSkill, fetchSkills, updateSkill } from '../api/career'
import { toApiError } from '../api/client'
import type { ApiError } from '../api/client'
import { useToast } from '../context/ToastContext'
import {
  PROFICIENCY_LEVELS,
  SKILL_CATEGORIES,
  type Proficiency,
  type Skill,
  type SkillCategory,
} from '../types/career'

const proficiencyTone: Record<Proficiency, string> = {
  Beginner: 'bg-slate-100 text-slate-700',
  Intermediate: 'bg-sky-100 text-sky-700',
  Advanced: 'bg-emerald-100 text-emerald-700',
  Expert: 'bg-violet-100 text-violet-700',
}

export default function SkillsPage() {
  const { notifySuccess, notifyError } = useToast()

  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SkillCategory>('Programming')
  const [proficiency, setProficiency] = useState<Proficiency>('Beginner')
  const [nameError, setNameError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setIsLoading(true)
    setLoadError(null)
    try {
      setSkills(await fetchSkills())
    } catch (err) {
      setLoadError((toApiError(err) as ApiError).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setEditing(null)
    setName('')
    setCategory('Programming')
    setProficiency('Beginner')
    setNameError(undefined)
    setModalOpen(true)
  }

  function openEdit(skill: Skill) {
    setEditing(skill)
    setName(skill.skill_name)
    setCategory(skill.category)
    setProficiency(skill.proficiency)
    setNameError(undefined)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Skill name is required.')
      return
    }
    setNameError(undefined)
    setIsSaving(true)

    try {
      const payload = { skill_name: name.trim(), category, proficiency }
      if (editing) {
        const updated = await updateSkill(editing.id, payload)
        setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        notifySuccess('Skill updated.')
      } else {
        const created = await createSkill(payload)
        setSkills((prev) => [...prev, created])
        notifySuccess('Skill added.')
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
      await deleteSkill(pendingDelete.id)
      setSkills((prev) => prev.filter((s) => s.id !== pendingDelete.id))
      notifySuccess('Skill deleted.')
      setPendingDelete(null)
    } catch (err) {
      notifyError((toApiError(err) as ApiError).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout title="Skills">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Track the skills you're building and how confident you are in each.
        </p>
        {skills.length > 0 && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
          >
            <Plus size={16} />
            Add Skill
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading skills…
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No skills added yet"
          description="Add your first skill to start building your Career Profile."
          actionLabel="+ Add Skill"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {skill.skill_name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">{skill.category}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(skill)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Edit ${skill.skill_name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(skill)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${skill.skill_name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--color-brand-500)]"
                    style={{ width: `${skill.proficiency_percent}%` }}
                  />
                </div>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${proficiencyTone[skill.proficiency]}`}
                >
                  {skill.proficiency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit skill' : 'Add skill'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="skillName"
            label="Skill name"
            type="text"
            placeholder="e.g. Python"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />
          <SelectField
            id="skillCategory"
            label="Category"
            options={SKILL_CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value as SkillCategory)}
          />
          <SelectField
            id="skillProficiency"
            label="Proficiency"
            options={PROFICIENCY_LEVELS}
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value as Proficiency)}
          />
          <p className="text-xs text-slate-400">
            Proficiency is your own self-assessment — it isn't an objective measurement.
          </p>
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
              {editing ? 'Save changes' : 'Add skill'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete skill"
        message={`Delete "${pendingDelete?.skill_name}" from your skills? This can't be undone.`}
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}
