// merchant/dashboard/-components/OverviewChart.tsx

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint, DateRange } from '../-dashboard.types'

interface OverviewChartProps {
  data: ChartDataPoint[]
  range: DateRange
}

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'أداء اليوم',
  '7days': 'أداء آخر 7 أيام',
  '30days': 'أداء هذا الشهر',
}

export function OverviewChart({ data, range }: OverviewChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">
          {RANGE_LABELS[range]}
        </h2>
        <span className="text-xs text-gray-400">بالعدد</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
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
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="delivered"
            name="مُسلّمة"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="returned"
            name="مُرتجعة"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}