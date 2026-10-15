import type { SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: readonly string[]
  error?: string
}

export default function SelectField({
  label,
  options,
  error,
  id,
  ...selectProps
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-1 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]'
        }`}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
