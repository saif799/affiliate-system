import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ConcentrationItem } from '../analytics.types'

interface Props {
  affiliates: ConcentrationItem[]
  merchants:  ConcentrationItem[]
}

function ParetoChart({ data, title, color }: { data: ConcentrationItem[]; title: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-1">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-400">تركز المخاطر — مبدأ Pareto</p>
      </div>
      {/* تحذير إذا top-3 يمثلون أكثر من 60% */}
      {data.slice(0, 3).reduce((s, i) => s + i.percentage, 0) > 60 && (
        <div className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          ⚠️ أعلى 3 يمثلون {data.slice(0, 3).reduce((s, i) => s + i.percentage, 0).toFixed(1)}% من الإيرادات — خطر تركز مرتفع
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
          <Tooltip
            formatter={(value, name) => [
              `${(value as number).toFixed(1)}%`,
              name === 'percentage' ? 'الحصة' : 'التراكمي',
            ]}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend formatter={(v) => v === 'percentage' ? 'الحصة %' : 'التراكمي %'} wrapperStyle={{ fontSize: 11 }} />
          <Bar    yAxisId="left"  dataKey="percentage" fill={color}   radius={[3, 3, 0, 0]} barSize={28} name="percentage" />
          <Line  yAxisId="right" dataKey="cumulative"  stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="cumulative" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ConcentrationChart({ affiliates, merchants }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ParetoChart data={affiliates} title="تركز إيرادات المسوقين" color="#6366f1" />
      <ParetoChart data={merchants}  title="تركز إيرادات التجار"   color="#22c55e" />
    </div>
  )
}