import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Award, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField from '../components/FormField'
import {
  createCertification,
  deleteCertification,
  fetchCertifications,
  updateCertification,
} from '../api/career'
import { toApiError } from '../api/client'
import type { ApiError } from '../api/client'
import { useToast } from '../context/ToastContext'
import type { Certification } from '../types/career'

interface FormState {
  name: string
  issuing_organization: string
  issue_date: string
  credential_url: string
  description: string
}

const emptyForm: FormState = {
  name: '',
  issuing_organization: '',
  issue_date: '',
  credential_url: '',
  description: '',
}

export default function CertificationsPage() {
  const { notifySuccess, notifyError } = useToast()

  const [items, setItems] = useState<Certification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Certification | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [nameError, setNameError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setIsLoading(true)
    setLoadError(null)
    try {
      setItems(await fetchCertifications())
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
    setNameError(undefined)
    setModalOpen(true)
  }

  function openEdit(cert: Certification) {
    setEditing(cert)
    setForm({
      name: cert.name,
      issuing_organization: cert.issuing_organization || '',
      issue_date: cert.issue_date || '',
      credential_url: cert.credential_url || '',
      description: cert.description || '',
    })
    setNameError(undefined)
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Certification name is required.')
      return
    }
    setNameError(undefined)
    setIsSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        issuing_organization: form.issuing_organization.trim() || null,
        issue_date: form.issue_date || null,
        credential_url: form.credential_url.trim() || null,
        description: form.description.trim() || null,
      }

      if (editing) {
        const updated = await updateCertification(editing.id, payload)
        setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        notifySuccess('Certification updated.')
      } else {
        const created = await createCertification(payload)
        setItems((prev) => [...prev, created])
        notifySuccess('Certification added.')
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
      await deleteCertification(pendingDelete.id)
      setItems((prev) => prev.filter((c) => c.id !== pendingDelete.id))
      notifySuccess('Certification deleted.')
      setPendingDelete(null)
    } catch (err) {
      notifyError((toApiError(err) as ApiError).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout title="Certifications">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Record the credentials you've earned along the way.
        </p>
        {items.length > 0 && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
          >
            <Plus size={16} />
            Add Certification
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading certifications…
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certifications added yet"
          description="Add your first certification to start building your Career Profile."
          actionLabel="+ Add Certification"
          onAction={openAdd}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Certification</th>
                  <th className="px-5 py-3 font-medium">Organization</th>
                  <th className="px-5 py-3 font-medium">Issued</th>
                  <th className="px-5 py-3 font-medium">Credential</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((cert) => (
                  <tr key={cert.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{cert.name}</p>
                      {cert.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {cert.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cert.issuing_organization || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{cert.issue_date || '—'}</td>
                    <td className="px-5 py-3">
                      {cert.credential_url ? (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-600)] hover:underline"
                        >
                          View <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(cert)}
                          className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Edit ${cert.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(cert)}
                          className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${cert.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit certification' : 'Add certification'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="certName"
            label="Certification name"
            type="text"
            placeholder="e.g. Deep Learning Specialization"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={nameError}
          />
          <FormField
            id="certOrg"
            label="Issuing organization"
            type="text"
            placeholder="e.g. DeepLearning.AI"
            value={form.issuing_organization}
            onChange={(e) => set('issuing_organization', e.target.value)}
          />
          <FormField
            id="certDate"
            label="Issue date"
            type="date"
            value={form.issue_date}
            onChange={(e) => set('issue_date', e.target.value)}
          />
          <FormField
            id="certUrl"
            label="Credential URL (optional)"
            type="url"
            placeholder="https://..."
            value={form.credential_url}
            onChange={(e) => set('credential_url', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="certDesc">
              Description
            </label>
            <textarea
              id="certDesc"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]"
            />
          </div>

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
              {editing ? 'Save changes' : 'Add certification'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete certification"
        message={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </DashboardLayout>
  )
}
