import type { AffiliateRisk, MerchantRisk, RiskLevel } from '../analytics.types'

interface Props {
  affiliates: AffiliateRisk[]
  merchants:  MerchantRisk[]
}

const RISK_CLASS: Record<RiskLevel, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
}
const RISK_LABEL: Record<RiskLevel, string> = {
  high:   'خطر عالٍ',
  medium: 'متوسط',
  low:    'منخفض',
}

function RiskBar({ rate, threshold }: { rate: number; threshold: number }) {
  const color = rate >= threshold ? 'bg-red-500' : rate >= threshold * 0.75 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-semibold ${rate >= threshold ? 'text-red-600' : 'text-gray-700'}`}>
        {rate}%
      </span>
      <div className="h-1.5 w-24 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
    </div>
  )
}

export function RiskList({ affiliates, merchants }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

      {/* ─── مسوقون خطرون ─── */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">مسوقون بنسبة إلغاء مرتفعة</h2>
            <p className="text-xs text-gray-400">تجاوزوا 40% — مراقبة مشددة</p>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            {affiliates.filter(a => a.riskLevel === 'high').length} خطر عالٍ
          </span>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-right">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">المسوق</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">الطلبات</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">نسبة الإلغاء</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">المخاطر</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a) => (
              <tr key={a.id} className="border-t border-gray-50 text-right hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.wilaya}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {a.cancelledOrders} / {a.totalOrders}
                </td>
                <td className="px-4 py-3">
                  <RiskBar rate={a.cancellationRate} threshold={50} />
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_CLASS[a.riskLevel]}`}>
                    {RISK_LABEL[a.riskLevel]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── تجار خطرون ─── */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">تجار بنسبة رفض مرتفعة</h2>
            <p className="text-xs text-gray-400">تجاوزوا 40% — مشبوه بالتهرب من العمولة</p>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            {merchants.filter(m => m.riskLevel === 'high').length} خطر عالٍ
          </span>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-right">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">التاجر</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">الطلبات</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">نسبة الرفض</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400">المخاطر</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-t border-gray-50 text-right hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.wilaya}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {m.rejectedOrders} / {m.receivedOrders}
                </td>
                <td className="px-4 py-3">
                  <RiskBar rate={m.rejectionRate} threshold={40} />
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_CLASS[m.riskLevel]}`}>
                    {RISK_LABEL[m.riskLevel]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}