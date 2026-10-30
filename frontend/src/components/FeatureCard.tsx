
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-[#DCE9EF] bg-white p-6 shadow-[0_2px_12px_rgba(29,63,90,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#96CAD3] hover:shadow-[0_16px_36px_rgba(29,63,90,0.09)] sm:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#1D3F5A] via-[#437B98] to-[#96CAD3] transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D6EAF0] bg-[#F0F7FA] text-[#356780] transition-colors duration-300 group-hover:bg-[#1D3F5A] group-hover:text-white">
        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#1D3F5A]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[#5B6F81]">
        {description}
      </p>
    </article>
  )
}
