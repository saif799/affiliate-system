// -components/MonthlyPayoutsChart.tsx //
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyPayoutPoint } from '../-commissions.types'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{fmt(p.value)} دج</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyPayoutsChart({ data }: { data: MonthlyPayoutPoint[] }) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-400 text-sm">لا توجد بيانات كافية لعرض الرسم البياني</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex justify-between items-baseline mb-5">
        <p className="text-sm font-semibold text-gray-800">المدفوعات الشهرية</p>
        <p className="text-xs text-gray-400">دج — مسوّقون مقابل تجار</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barGap={2}
          barCategoryGap="30%"
        >
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>
            )}
          />
          <Bar dataKey="merchantAmount" name="التجار" fill="#1D9E75" radius={[4, 4, 0, 0]} />
          <Bar dataKey="affiliateAmount" name="المسوّقون" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}