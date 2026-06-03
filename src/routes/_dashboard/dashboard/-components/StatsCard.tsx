import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { StatMetric } from '../-dashboard.types'

type Format = 'dzd' | 'number' | 'percent'

interface StatsCardProps {
  label:  string
  metric: StatMetric
  format: Format
  icon:   string
}

function formatValue(value: number, format: Format): string {
  switch (format) {
    case 'dzd':
      return value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)} M DZD`
        : `${value.toLocaleString('fr-DZ')} DZD`
    case 'percent':
      return `${value}%`
    default:
      return value.toLocaleString('fr-DZ')
  }
}

export function StatsCard({ label, metric, format, icon }: StatsCardProps) {
  const isPositive = metric.growth >= 0
  const chartData  = metric.sparkline.map((v) => ({ v }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{icon}</span>
            <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">
            {formatValue(metric.value, format)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span className={isPositive ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
              {isPositive ? '↑' : '↓'} {Math.abs(metric.growth)}%
            </span>
            <span className="text-gray-400">vs الشهر الماضي</span>
          </div>
        </div>

        <div className="h-12 w-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
