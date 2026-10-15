import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  error?: string
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-md border px-3 py-2 pr-10 text-sm outline-none focus:ring-1 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-[var(--color-brand-500)] focus:ring-[var(--color-brand-500)]'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
