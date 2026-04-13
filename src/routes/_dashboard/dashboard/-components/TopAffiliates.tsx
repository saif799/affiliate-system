import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { TopAffiliate } from '../dashboard.types'

interface TopAffiliatesProps {
  affiliates: TopAffiliate[]
}

export function TopAffiliates({ affiliates }: TopAffiliatesProps) {
  const chartData = affiliates.map((a) => ({
    name:    a.name.split(' ')[0],  // الاسم الأول فقط للمحور
    revenue: a.revenue,
    conv:    a.conversions,
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">أفضل المسوّقين</h2>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(value, name) => [
              name === 'revenue'
                ? `${Number(value).toLocaleString('fr-DZ')} DZD`
                : `${value} تحويل`,
              name === 'revenue' ? 'الإيرادات' : 'التحويلات',
            ]}
          />
          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* جدول مفصّل */}
      <ul className="mt-3 divide-y divide-gray-100">
        {affiliates.map((a, i) => (
          <li key={a.id} className="flex items-center justify-between py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 font-bold text-gray-400">{i + 1}</span>
              <div>
                <p className="font-medium text-gray-800">{a.name}</p>
                <p className="text-gray-400">{a.wilaya} · {a.conversions} تحويل</p>
              </div>
            </div>
            <span className="font-semibold text-gray-900">
              {(a.revenue / 1000).toFixed(0)}k DZD
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
