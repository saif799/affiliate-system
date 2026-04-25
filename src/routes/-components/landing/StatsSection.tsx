// ─── src/routes/-components/landing/StatsSection.tsx ───

import { platformStats } from '../../-data/landing.data'

export function StatsSection() {
  return (
    <section id="stats" className="px-12 py-8">
      <div
        className="mx-auto max-w-225 overflow-hidden rounded-xl border border-violet-100 bg-white"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        {platformStats.map((stat, i) => (
          <div
            key={stat.label}
            className="px-6 py-6 text-center"
            style={{
              borderRight: i < platformStats.length - 1 ? '1px solid #ede9fe' : undefined,
            }}
          >
            <div className="text-[34px] font-black text-violet-600">{stat.value}</div>
            <div className="mt-1 text-[13px] font-semibold text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}