
import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  Award,
  BrainCircuit,
  Briefcase,
  CalendarClock,
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
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#E6EEF2] px-4 py-4">
        <Link
          to="/dashboard"
          className="flex min-w-0 items-center"
          onClick={() => setSidebarOpen(false)}
          aria-label="CareerPilot AI dashboard"
        >
          <img
            src="/images/careerpilot-logo.png"
            alt="CareerPilot AI"
            className="h-10 w-auto max-w-[190px] object-contain object-left"
          />
        </Link>

        <button
          className="rounded-lg p-2 text-[#5B6F81] transition hover:bg-[#F0F7FA] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        >
          <X size={19} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8294A3]">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'border-[#D6EAF0] bg-[#F0F7FA] text-[#1D3F5A] shadow-sm'
                        : 'border-transparent text-[#5B6F81] hover:bg-[#F8FBFC] hover:text-[#1D3F5A]'
                    }`
                  }
                >
                  <item.icon
                    size={17}
                    strokeWidth={1.8}
                    className="shrink-0"
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#E6EEF2] p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5B6F81] transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#F8FBFC]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#E2ECF1] bg-white md:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 h-full w-full bg-[#0F1F2E]/40 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 w-[280px] border-r border-[#E2ECF1] bg-white shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex min-h-[68px] items-center gap-3 border-b border-[#E2ECF1] bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 text-[#1D3F5A] transition hover:bg-[#F0F7FA] md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8294A3] sm:block">
              CareerPilot AI
            </p>
            <h1 className="truncate text-base font-bold tracking-tight text-[#1D3F5A] md:text-lg">
              {title}
            </h1>
          </div>

          <div className="relative ml-auto hidden max-w-sm flex-1 lg:block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8294A3]"
            />
            <input
              type="search"
              placeholder="Search your profile…"
              aria-label="Search your profile"
              className="w-full rounded-xl border border-[#E2ECF1] bg-[#F8FBFC] py-2 pl-9 pr-3 text-sm text-[#0F1F2E] outline-none transition placeholder:text-[#8294A3] focus:border-[#437B98] focus:bg-white focus:ring-2 focus:ring-[#D6EAF0]"
            />
          </div>

          <div className="relative ml-auto lg:ml-2">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#F0F7FA]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D3F5A] text-xs font-bold text-white ring-2 ring-[#D6EAF0]">
                {user ? initialsOf(user.name) : '?'}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-[#1D3F5A] sm:block">
                {user?.name}
              </span>
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-[#E2ECF1] bg-white py-1.5 shadow-xl shadow-[#1D3F5A]/10">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#43576A] transition hover:bg-[#F0F7FA] hover:text-[#1D3F5A]"
                  >
                    <UserRound size={16} />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#43576A] transition hover:bg-[#F0F7FA] hover:text-[#1D3F5A]"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-[#E6EEF2]" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#43576A] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main
          key={location.pathname}
          className="min-w-0 flex-1 p-4 sm:p-5 md:p-7 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
