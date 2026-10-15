import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={20} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
