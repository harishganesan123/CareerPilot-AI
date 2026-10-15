import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'

interface ComingSoonPageProps {
  title: string
  description: string
  /** Which phase this module is planned for, so the state is informative. */
  plannedFor?: string
}

export default function ComingSoonPage({
  title,
  description,
  plannedFor,
}: ComingSoonPageProps) {
  return (
    <DashboardLayout title={title}>
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <Construction size={22} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
        <p className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Coming soon{plannedFor ? ` — planned for ${plannedFor}` : ''}
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-600)] hover:underline"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>
    </DashboardLayout>
  )
}
