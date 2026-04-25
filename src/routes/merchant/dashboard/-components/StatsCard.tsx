// merchant/dashboard/-components/StatsCard.tsx

import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: string
  trend?: {
    value: number    // موجب = ارتفاع، سالب = انخفاض
    label: string
  }
  hint?: string 
  alert?: boolean    // true = يظهر باللون الأحمر (للروتور مثلاً)
  urgent?: boolean   // true = يظهر باللون البرتقالي (للتغليف)
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  alert = false,
  urgent = false,
  hint
}: StatsCardProps) {
  const getBorderColor = () => {
    if (alert)  return 'border-l-4 border-l-red-400'
    if (urgent) return 'border-l-4 border-l-orange-400'
    return ''
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 ${getBorderColor()}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>

      <p className={`mt-2 text-2xl font-bold tracking-tight ${
        alert  ? 'text-red-600'    :
        urgent ? 'text-orange-500' :
        'text-gray-900'
      }`}>
        {value}
      </p>

      {/* hint يظهر بدل trend */}
      {hint && (
        <p className="mt-2 text-xs text-blue-500">
          {hint}
        </p>
      )}

      {trend && !hint && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${
          trend.value >= 0 ? 'text-green-600' : 'text-red-500'
        }`}>
          {trend.value >= 0
            ? <TrendingUp  size={12} />
            : <TrendingDown size={12} />
          }
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  )
}