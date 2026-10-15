import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  Award,
  BrainCircuit,
  Briefcase,
  CalendarClock,
  Compass,
  FileSearch,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Career Profile',
    items: [
      { label: 'My Profile', to: '/profile', icon: UserRound },
      { label: 'Skills', to: '/skills', icon: Wrench },
      { label: 'Projects', to: '/projects', icon: FolderGit2 },
      { label: 'Certifications', to: '/certifications', icon: Award },
      { label: 'Career Goals', to: '/career-goals', icon: Target },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { label: 'AI Academic Assistant', to: '/ai/assistant', icon: BrainCircuit },
      { label: 'Study Planner', to: '/ai/study-planner', icon: CalendarClock },
      { label: 'Resume Analyzer', to: '/ai/resume-analyzer', icon: FileSearch },
      { label: 'Skill Gap Analysis', to: '/ai/skill-gap', icon: TrendingUp },
      { label: 'Career Recommendations', to: '/ai/career-recommendations', icon: Sparkles },
    ],
  },
  {
    title: 'Placement',
    items: [
      { label: 'Interview Prep', to: '/placement/interview-prep', icon: MessagesSquare },
      { label: 'Placement Readiness', to: '/placement/readiness', icon: Briefcase },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', to: '/settings', icon: Settings }],
  },
]

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function DashboardLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-500)] text-white">
            <Compass size={16} />
          </span>
          <span className="font-semibold text-slate-900">CareerPilot AI</span>
        </Link>
        <button
          className="text-slate-500 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <item.icon size={17} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <button
            className="text-slate-600 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">
            {title}
          </h1>

          <div className="relative ml-auto hidden max-w-xs flex-1 lg:block">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search your profile…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-brand-500)] focus:bg-white"
            />
          </div>

          <div className="relative ml-auto lg:ml-0">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-xs font-semibold text-white">
                {user ? initialsOf(user.name) : '?'}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-700 sm:block">
                {user?.name}
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserRound size={15} />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main key={location.pathname} className="min-w-0 flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
