export default function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-semibold text-slate-900">CareerPilot AI</p>
            <p className="mt-1 max-w-md">
              An intelligent academic and career development platform built as a B.Tech
              Artificial Intelligence minor project.
            </p>
          </div>
          <p>&copy; {new Date().getFullYear()} CareerPilot AI. Built for academic demonstration.</p>
        </div>
      </div>
    </footer>
  )
}
