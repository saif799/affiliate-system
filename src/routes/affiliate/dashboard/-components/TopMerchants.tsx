import type { TopMerchant } from '../-dashboard.types'

interface Props {
  merchants: TopMerchant[]
}

export function TopMerchants({ merchants }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">لوحة الشرف — أفضل التجار</h2>
        <p className="text-xs text-gray-400 mt-0.5">بناءً على معدل الاستلام وحجم الأرباح</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="px-4 py-3 text-xs font-medium text-gray-500">#</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">التاجر</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الطلبيات</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الاستلام</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الروتور</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">أرباحي</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m, index) => (
            <tr key={m.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
              <td className="px-4 py-3 text-xs text-gray-400 font-medium">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </td>
              <td className="px-4 py-3">
                <p className="text-xs font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400">{m.category}</p>
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">{m.totalOrders}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  {m.deliveredRate}%
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    m.retourRate > 25
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      m.retourRate > 25 ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                  />
                  {m.retourRate}%
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                {m.earnings.toLocaleString('ar-DZ')} د.ج
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}