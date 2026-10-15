import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

type ToastVariant = 'success' | 'error'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  notifySuccess: (message: string) => void
  notifyError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, message, variant }])
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      notifySuccess: (message: string) => push(message, 'success'),
      notifyError: (message: string) => push(message, 'error'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              toast.variant === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {toast.variant === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
