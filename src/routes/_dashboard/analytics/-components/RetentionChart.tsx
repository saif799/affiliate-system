import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyRetention } from '../analytics.types'

interface Props {
  data: MonthlyRetention[]
}

export function RetentionChart({ data }: Props) {
  const avg = Math.round(data.reduce((s, d) => s + d.retentionRate, 0) / data.length)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Retention المسوقين</h2>
          <p className="text-xs text-gray-400">% المسوقين الذين بقوا نشطين من شهر لآخر</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${avg >= 75 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          متوسط {avg}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 85]} unit="%" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Retention']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Line type="monotone" dataKey="retentionRate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}