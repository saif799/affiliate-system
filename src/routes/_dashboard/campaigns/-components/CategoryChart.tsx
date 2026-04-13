import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { CategoryStat } from '../campaigns.types'

interface Props {
  data: CategoryStat[]
}

export function CategoryChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        توزيع الحملات حسب الفئة
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              value,
              name === 'campaigns' ? 'الحملات' : 'التحويلات',
            ]}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="conversions" fill="#6366f1" radius={[4, 4, 0, 0]} name="التحويلات" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}