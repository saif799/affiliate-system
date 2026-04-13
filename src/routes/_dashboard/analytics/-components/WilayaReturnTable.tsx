import type { WilayaReturnRate, RiskLevel } from '../analytics.types'

interface Props {
  data: WilayaReturnRate[]
}

const RISK_CLASS: Record<RiskLevel, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
}
const RISK_LABEL: Record<RiskLevel, string> = {
  high:   'خطر — أوقف الإعلانات',
  medium: 'مراقبة',
  low:    'آمن',
}

export function WilayaReturnTable({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.returnRate - a.returnRate)

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">الروتور الجغرافي</h2>
          <p className="text-xs text-gray-400">نسبة الإرجاع حسب الولاية — تحذير عند تجاوز 35%</p>
        </div>
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          {sorted.filter(w => w.riskLevel === 'high').length} ولايات خطرة
        </span>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-right">
            <th className="px-4 py-2.5 text-xs font-medium text-gray-400">الولاية</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-400">الطلبات</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-400">الإرجاع</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-400">نسبة الروتور</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-400">التوصية</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((w) => (
            <tr key={w.wilaya} className="border-t border-gray-50 text-right hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{w.wilaya}</td>
              <td className="px-4 py-3 text-gray-600">{w.orders.toLocaleString('fr-DZ')}</td>
              <td className="px-4 py-3 text-gray-600">{w.returns}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${w.returnRate >= 35 ? 'text-red-600' : 'text-gray-700'}`}>
                    {w.returnRate}%
                  </span>
                  <div className="h-1.5 w-20 rounded-full bg-gray-100">
                    <div
                      className={`h-1.5 rounded-full ${w.returnRate >= 35 ? 'bg-red-500' : w.returnRate >= 20 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(w.returnRate * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_CLASS[w.riskLevel]}`}>
                  {RISK_LABEL[w.riskLevel]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}