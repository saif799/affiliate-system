import type { WilayaStat } from '../-analytics.types'

interface WilayaListProps {
  stats: WilayaStat[]
}

export function WilayaList({ stats }: WilayaListProps) {
  const maxOrders = Math.max(...stats.map((s) => s.orders_count), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex justify-between flex-row-reverse mb-4 gap-2">
        <span className="text-sm font-semibold text-gray-700">
          الولايات — أعلى 10 طلبات
        </span>
        <span className="text-xs text-gray-400">نسبة الرتورن</span>
      </div>

      <div className="flex flex-col gap-3">
        {stats.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">لا توجد بيانات</p>
        ) : (
          stats.map((s) => (
            <div
              key={s.wilaya}
              className="flex items-center gap-2 sm:gap-3 flex-row-reverse"
            >
              <span className="text-xs text-gray-600 w-16 sm:w-24 text-right truncate">
                {s.wilaya}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${(s.orders_count / maxOrders) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">
                {s.orders_count}
              </span>
              <span
                className={`text-xs w-10 text-right font-medium ${
                  s.return_rate_pct > 25
                    ? 'text-red-500'
                    : s.return_rate_pct > 15
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}
              >
                {s.return_rate_pct}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}