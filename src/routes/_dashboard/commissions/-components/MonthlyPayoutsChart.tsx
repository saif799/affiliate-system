import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyPayout } from '../commissions.types'

interface Props {
  data: MonthlyPayout[]
}

function formatDZD(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000)    return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

export function MonthlyPayoutsChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800">المدفوعات الشهرية</h2>
        <p className="text-xs text-gray-400">DZD — مسوقون مقابل تجار</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatDZD} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [
              `${(value as number).toLocaleString('fr-DZ')} DZD`,
              name === 'affiliatePayout' ? 'المسوقون' : 'التجار',
            ]}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            formatter={(value) => (value === 'affiliatePayout' ? 'المسوقون' : 'التجار')}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="affiliatePayout" fill="#6366f1" radius={[3, 3, 0, 0]} name="affiliatePayout" />
          <Bar dataKey="merchantPayout"  fill="#22c55e" radius={[3, 3, 0, 0]} name="merchantPayout"  />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}