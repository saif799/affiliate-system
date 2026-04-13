import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { MonthlyRevenue } from '../dashboard.types'

interface OverviewChartProps {
  data: MonthlyRevenue[]
}

function formatDZD(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">نظرة عامة على الإيرادات</h2>
        <span className="text-xs text-gray-400">بالدينار الجزائري DZD</span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatDZD} />
          <Tooltip
            formatter={(value) => [
              value === undefined ? '' : `${Number(value).toLocaleString('fr-DZ')} DZD`,
            ]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
          <Area type="monotone" dataKey="gmv"             name="GMV"             stroke="#6366f1" strokeWidth={2} fill="url(#gmvGrad)" />
          <Area type="monotone" dataKey="platformRevenue" name="عمولة المنصة" stroke="#22c55e" strokeWidth={2} fill="url(#revGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
