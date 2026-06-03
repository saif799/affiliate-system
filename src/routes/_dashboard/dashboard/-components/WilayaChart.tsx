import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import type { WilayaStat } from '../-dashboard.types'

const COLORS = [
  '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff',
  '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff',
]

interface WilayaChartProps {
  data: WilayaStat[]
}

export function WilayaChart({ data }: WilayaChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">🇩🇿 التوزيع الجغرافي</h2>
        <span className="text-xs text-gray-400">أعلى 10 ولايات</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 60, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="wilaya"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => [`${value} تحويل`, 'التحويلات']}
          />
          <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
