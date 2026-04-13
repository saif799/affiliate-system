import type { CommissionMetric } from '../commissions.types'

interface Props {
  label:    string
  icon:     string
  metric:   CommissionMetric
  format:   'dzd' | 'number'
}

function formatValue(value: number, format: 'dzd' | 'number') {
  if (format === 'dzd') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)} M DZD`
    return value.toLocaleString('fr-DZ') + ' DZD'
  }
  return value.toLocaleString('fr-DZ')
}

export function CommissionStatsCard({ label, icon, metric, format }: Props) {
  const isPositive  = metric.change >= 0
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500'
  const prefix      = isPositive ? '↑' : '↓'

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="text-xl font-bold text-gray-900 leading-tight">
        {formatValue(metric.value, format)}
      </div>
      <div className={`mt-1 text-xs font-medium ${changeColor}`}>
        {prefix} {Math.abs(metric.change)}% vs الشهر الماضي
      </div>
    </div>
  )
}