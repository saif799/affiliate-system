import type { TopMerchant } from '../-analytics.types'

interface MerchantsTableProps {
  merchants: TopMerchant[]
}

function fmtDzd(n: number) {
  const v = n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : n.toLocaleString('fr-DZ')
  return `${v} دج`
}

function ReturnBadge({ pct }: { pct: number }) {
  const cls =
    pct > 25 ? 'bg-red-50 text-red-600'
    : pct > 15 ? 'bg-amber-50 text-amber-600'
    : 'bg-emerald-50 text-emerald-600'

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {pct}%
    </span>
  )
}

export function MerchantsTable({ merchants }: MerchantsTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-4 border-b border-gray-50 text-right">
        <span className="text-sm font-semibold text-gray-700">
          أفضل 5 تجار — إيراداً
        </span>
      </div>

      {merchants.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">لا توجد بيانات</p>
      ) : (
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'التاجر', 'الطلبات', 'نسبة الرتورن', 'الإيراد'].map((h) => (
                <th
                  key={h}
                  className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {merchants.map((m, i) => (
              <tr
                key={m.merchant_id}
                className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">
                  {m.business_name}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {m.orders_total}
                </td>
                <td className="px-4 py-3 text-right">
                  <ReturnBadge pct={m.return_rate_pct} />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  {fmtDzd(m.revenue_dzd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}