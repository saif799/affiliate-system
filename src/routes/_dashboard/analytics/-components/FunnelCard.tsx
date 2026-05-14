import type { FunnelData } from '../-analytics.types'

interface FunnelCardProps {
  funnel: FunnelData
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('fr-DZ')
}

export function FunnelCard({ funnel }: FunnelCardProps) {
  const steps = [
    {
      label: 'نقرات',
      value: funnel.clicks,
      color: 'bg-blue-500',
      pct:   100,
    },
    {
      label: 'طلبات',
      value: funnel.orders,
      color: 'bg-violet-500',
      pct:   funnel.clicks > 0
        ? Math.round((funnel.orders / funnel.clicks) * 100)
        : 0,
    },
    {
      label: 'تم التوصيل',
      value: funnel.delivered,
      color: 'bg-emerald-500',
      pct:   funnel.orders > 0
        ? Math.round((funnel.delivered / funnel.orders) * 100)
        : 0,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <span className="text-sm font-semibold text-gray-700 text-right">
        قمع التحويل
      </span>
      {steps.map((s) => (
        <div key={s.label} className="flex flex-col gap-1">
          <div className="flex justify-between flex-row-reverse">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className="text-sm font-semibold text-gray-800">{fmt(s.value)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${s.color} rounded-full transition-all duration-700`}
              style={{ width: `${s.pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 text-left">{s.pct}%</span>
        </div>
      ))}
    </div>
  )
}