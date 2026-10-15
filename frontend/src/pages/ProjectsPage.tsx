import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ExternalLink,
  FolderGit2,
  Code2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import SelectField from '../components/SelectField'
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from '../api/career'
import { toApiError } from '../api/client'
import type { ApiError } from '../api/client'
import { useToast } from '../context/ToastContext'
import { PROJECT_TYPES, type Project, type ProjectType } from '../types/career'

interface FormState {
  title: string
  description: string
  technologies: string
  project_type: ProjectType
  role: string
  github_url: string
  demo_url: string
  start_date: string
  end_date: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  technologies: '',
  project_type: 'Personal',
  role: '',
  github_url: '',
  demo_url: '',
  start_date: '',
  end_date: '',
}

export default function ProjectsPage() {
  const { notifySuccess, notifyError } = useToast()

  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [titleError, setTitleError] = useState<string | undefined>()
  const [dateError, setDateError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setIsLoading(true)
    setLoadError(null)
    try {
      setProjects(await fetchProjects())
    } catch (err) {
      setLoadError((toApiError(err) as ApiError).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setTitleError(undefined)
    setDateError(undefined)
    setModalOpen(true)
  }

  function openEdit(project: Project) {
    setEditing(project)
    setForm({
      title: project.title,
      description: project.description || '',
      technologies: project.technologies.join(', '),
      project_type: project.project_type,
      role: project.role || '',
      github_url: project.github_url || '',
      demo_url: project.demo_url || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    })
    setTitleError(undefined)
    setDateError(undefined)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    let valid = true

    if (!form.title.trim()) {
      setTitleError('Project title is required.')
      valid = false
    } else {
      setTitleError(undefined)
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setDateError('End date cannot be before the start date.')
      valid = false
    } else {
      setDateError(undefined)
    }

    if (!valid) return
    setIsSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        technologies: form.technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        project_type: form.project_type,
        role: form.role.trim() || null,
        github_url: form.github_url.trim() || null,
        demo_url: form.demo_url.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }

      if (editing) {
        const updated = await updateProject(editing.id, payload)
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        notifySuccess('Project updated.')
      } else {
        const created = await createProject(payload)
        setProjects((prev) => [...prev, created])
        notifySuccess('Project added.')
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
      await deleteProject(pendingDelete.id)
      setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      notifySuccess('Project deleted.')
      setPendingDelete(null)
    } catch (err) {
      notifyError((toApiError(err) as ApiError).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout title="Projects">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Showcase the work you've built during your studies and internships.
        </p>
        {projects.length > 0 && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
          >
            <Plus size={16} />
            Add Project
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading projects…
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects added yet"
          description="Add your first project to start building your Career Profile."
          actionLabel="+ Add Project"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{project.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                      {project.project_type}
                    </span>
                    {project.role && <span>{project.role}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(project)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Edit ${project.title}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(project)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${project.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                  {project.description}
                </p>
              )}

              {project.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded bg-[var(--color-brand-50)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-brand-700)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {(project.start_date || project.end_date) && (
                <p className="mt-3 text-xs text-slate-400">
                  {project.start_date || '—'} → {project.end_date || 'Present'}
                </p>
              )}

              {(project.github_url || project.demo_url) && (
                <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-xs">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                    >
                      <Code2 size={13} /> Code
                    </a>
                  )}
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                    >
                      <ExternalLink size={13} /> Demo
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit project' : 'Add project'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="projectTitle"
            label="Project title"
            type="text"
            placeholder="e.g. CareerPilot AI"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            error={titleError}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="projectDesc">
              Description
            </label>
            <textarea
              id="projectDesc"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
            />
          </div>

          <FormField
            id="projectTech"
            label="Technologies (comma-separated)"
            type="text"
            placeholder="React, FastAPI, PostgreSQL"
            value={form.technologies}
            onChange={(e) => set('technologies', e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="projectType"
              label="Project type"
              options={PROJECT_TYPES}
              value={form.project_type}
              onChange={(e) => set('project_type', e.target.value as ProjectType)}
            />
            <FormField
              id="projectRole"
              label="Your role"
              type="text"
              placeholder="e.g. Full-stack developer"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="projectStart"
              label="Start date"
              type="date"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
            />
            <FormField
              id="projectEnd"
              label="End date"
              type="date"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
              error={dateError}
            />
          </div>

          <FormField
            id="projectGithub"
            label="GitHub URL (optional)"
            type="url"
            placeholder="https://github.com/..."
            value={form.github_url}
            onChange={(e) => set('github_url', e.target.value)}
          />
          <FormField
            id="projectDemo"
            label="Demo URL (optional)"
            type="url"
            placeholder="https://..."
            value={form.demo_url}
            onChange={(e) => set('demo_url', e.target.value)}
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
              {editing ? 'Save changes' : 'Add project'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete project"
        message={`Delete "${pendingDelete?.title}"? This can't be undone.`}
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}
