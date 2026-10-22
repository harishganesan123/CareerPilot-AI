
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/#features' },
    { label: 'About', href: '/#about' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3"
          onClick={() => setOpen(false)}
          aria-label="CareerPilot AI home"
        >
          <img
            src="/images/careerpilot-logo.png"
            alt="CareerPilot AI"
            className="h-11 w-auto max-w-[220px] object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#437B98]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1D3F5A] transition hover:bg-[#F0F7FA]"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="rounded-lg bg-[#1D3F5A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#437B98] focus:outline-none focus:ring-2 focus:ring-[#96CAD3] focus:ring-offset-2"
          >
            Get Started
          </button>
        </div>

        <button
          className="rounded-lg p-2 text-[#1D3F5A] transition hover:bg-[#F0F7FA] md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 md:hidden sm:px-6">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#F0F7FA] hover:text-[#1D3F5A]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/login')
                }}
                className="flex-1 rounded-lg border border-[#D6EAF0] px-4 py-2.5 text-sm font-semibold text-[#1D3F5A] transition hover:bg-[#F8FBFC]"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/register')
                }}
                className="flex-1 rounded-lg bg-[#1D3F5A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#437B98]"
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
