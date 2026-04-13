import type { CampaignMetric } from '../campaigns.types'

interface Props {
  label:  string
  icon:   string
  metric: CampaignMetric
}

export function CampaignStatsCard({ label, icon, metric }: Props) {
  const isPositive = metric.change >= 0
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500'
  const changePrefix = isPositive ? '↑' : '↓'

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-base">{icon}</span>
      </div>

      <div className="text-2xl font-bold text-gray-900">
        {metric.value.toLocaleString('fr-DZ')}
      </div>

      <div className={`mt-1 text-xs font-medium ${changeColor}`}>
        {changePrefix} {Math.abs(metric.change)}% vs الشهر الماضي
      </div>
    </div>
  )
}