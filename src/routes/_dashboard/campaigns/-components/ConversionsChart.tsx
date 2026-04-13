import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { MonthlyConversions } from '../campaigns.types'

interface Props {
  data: MonthlyConversions[]
}

function formatDZD(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000)    return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

export function ConversionsChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            التحويلات والإيرادات الشهرية
          </h2>
          <p className="text-xs text-gray-400">DZD بالدينار الجزائري</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradConversions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={formatDZD} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />

          <Tooltip
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : 0
              return name === 'revenue'
                ? [`${num.toLocaleString('fr-DZ')} DZD`, 'الإيرادات']
                : [num.toLocaleString('fr-DZ'), 'التحويلات']
            }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            formatter={(value) => (value === 'conversions' ? 'التحويلات' : 'الإيرادات')}
            wrapperStyle={{ fontSize: 12 }}
          />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="conversions"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradConversions)"
            dot={false}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}