import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyProfitability } from '../analytics.types'

interface Props {
  data: MonthlyProfitability[]
}

function fmt(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}K`
  return String(v)
}

const NAMES: Record<string, string> = {
  gmv:             'إجمالي التداول (GMV)',
  platformRevenue: 'عمولة المنصة',
  affiliatePayout: 'مدفوعات المسوقين',
}

export function ProfitabilityChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800">GMV مقابل أرباح الوساطة</h2>
        <p className="text-xs text-gray-400">ما دخل المنصة مقابل ما خرج منها — DZD</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gGMV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="gPay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [
              `${(value as number).toLocaleString('fr-DZ')} DZD`,
              NAMES[name as string] ?? name,
            ]}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend formatter={(v) => NAMES[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="gmv"             stroke="#6366f1" strokeWidth={2} fill="url(#gGMV)" dot={false} />
          <Area type="monotone" dataKey="platformRevenue" stroke="#22c55e" strokeWidth={2} fill="url(#gRev)" dot={false} />
          <Area type="monotone" dataKey="affiliatePayout" stroke="#f59e0b" strokeWidth={2} fill="url(#gPay)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}