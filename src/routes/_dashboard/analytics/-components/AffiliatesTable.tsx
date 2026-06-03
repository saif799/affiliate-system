import type { TopAffiliate } from '../-analytics.types'

interface AffiliatesTableProps {
  affiliates: TopAffiliate[]
}

function fmtDzd(n: number) {
  const v = n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : n.toLocaleString('fr-DZ')
  return `${v} دج`
}

function RefusalBadge({ pct }: { pct: number }) {
  const cls =
    pct > 20 ? 'bg-red-50 text-red-600'
    : pct > 10 ? 'bg-amber-50 text-amber-600'
    : 'bg-emerald-50 text-emerald-600'

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {pct}%
    </span>
  )
}

export function AffiliatesTable({ affiliates }: AffiliatesTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50 text-right">
        <span className="text-sm font-semibold text-gray-700">
          أفضل 5 مسوقين — ربحاً
        </span>
      </div>

      {affiliates.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">لا توجد بيانات</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'المسوق', 'الطلبات', 'نسبة الرفض', 'الربح'].map((h) => (
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
            {affiliates.map((a, i) => (
              <tr
                key={a.affiliate_id}
                className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{a.name}</p>
                    {a.wilaya && (
                      <p className="text-xs text-gray-400">{a.wilaya}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {a.orders_total}
                </td>
                <td className="px-4 py-3 text-right">
                  <RefusalBadge pct={a.refusal_rate_pct} />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  {fmtDzd(a.revenue_dzd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}