import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'About', href: '/#about' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-500)] text-white">
            <Compass size={18} />
          </span>
          <span className="text-lg tracking-tight">CareerPilot AI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => navigate('/login')}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-brand-600)]"
          >
            Get Started
          </button>
        </div>

        <button
          className="text-slate-700 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 rounded-md bg-[var(--color-brand-500)] px-4 py-2 text-sm font-medium text-white"
              >
                Get Started
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
