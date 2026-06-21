import { Change } from './Change'

interface KpiCardProps {
  label: string
  value: string
  change?: number | null
  accent?: 'green' | 'amber' | 'red' | 'blue'
  sub?: string
}

const accentMap: Record<NonNullable<KpiCardProps['accent']>, string> = {
  green: 'border-t-emerald-500',
  amber: 'border-t-amber-400',
  red:   'border-t-red-400',
  blue:  'border-t-blue-500',
}

export function KpiCard({ label, value, change, accent = 'blue', sub }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-t-2 ${accentMap[accent]} p-4 sm:p-5 flex flex-col gap-2 shadow-sm min-w-0`}>
      <span className="text-xs sm:text-sm text-gray-500 text-right">{label}</span>
      <span className="text-xl sm:text-2xl font-bold text-gray-900 text-right tracking-tight break-words">{value}</span>
      {sub && <span className="text-xs text-gray-400 text-right break-words">{sub}</span>}
      {change !== undefined && (
        <div className="text-right">
          <Change pct={change} />
        </div>
      )}
    </div>
  )
}