// ─── src/routes/-components/landing/StatsSection.tsx ───

import { platformStats } from '../../-data/landing.data'

export function StatsSection() {
  return (
    <section id="stats" className="px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-225 grid-cols-2 divide-violet-100 overflow-hidden rounded-xl border border-violet-100 bg-white lg:grid-cols-4 [&>*:nth-child(odd)]:border-e [&>*:nth-child(odd)]:border-violet-100 lg:[&>*:not(:last-child)]:border-e">
        {platformStats.map((stat) => (
          <div
            key={stat.label}
            className="border-t border-violet-100 px-4 py-5 text-center first:border-t-0 [&:nth-child(2)]:border-t-0 lg:border-t-0 sm:px-6 sm:py-6"
          >
            <div className="text-[26px] font-black text-violet-600 sm:text-[30px] lg:text-[34px]">{stat.value}</div>
            <div className="mt-1 text-[12px] font-semibold text-gray-400 sm:text-[13px]">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}