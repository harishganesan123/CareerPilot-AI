import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]'
        }`}
        {...inputProps}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
