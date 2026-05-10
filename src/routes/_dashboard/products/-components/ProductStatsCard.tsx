import type { ProductStatsMetric } from '../-campaigns.types'

interface Props {
  label:   string
  icon:    string
  metric:  ProductStatsMetric
  danger?: boolean
}

export function ProductStatsCard({ label, icon, metric, danger }: Props) {
  // changeVsPrev يمكن أن يكون null (لا يوجد شهر ماضٍ للمقارنة)
  const hasChange    = metric.changeVsPrev !== null
  const isPositive   = (metric.changeVsPrev ?? 0) >= 0
  const changeColor  = isPositive ? 'text-green-500' : 'text-red-500'
  const changePrefix = isPositive ? '↑' : '↓'

  return (
    <div
      className={[
        'rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        danger
          ? 'border-red-200 border-r-[3px] border-r-red-400'
          : 'border-gray-100',
      ].join(' ')}
    >
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-base leading-none">{icon}</span>
      </div>

      {/* value */}
      <div className="text-2xl font-bold text-gray-900">
        {metric.value.toLocaleString('fr-DZ')}
      </div>

      {/* change vs last month */}
      <div className={`mt-1 text-xs font-medium ${hasChange ? changeColor : 'text-gray-400'}`}>
        {hasChange
          ? `${changePrefix} ${Math.abs(metric.changeVsPrev!)}% vs الشهر الماضي`
          : `+${metric.newThisMonth} هذا الشهر (جديد)`
        }
      </div>
    </div>
  )
}