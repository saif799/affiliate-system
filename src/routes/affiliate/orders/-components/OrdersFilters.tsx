import type { OrderStatus, TabCounts } from '../-orders.types'

interface Props {
  activeTab: OrderStatus | 'all'
  search: string
  wilaya: string
  counts: TabCounts
  onTabChange: (tab: OrderStatus | 'all') => void
  onSearchChange: (v: string) => void
  onWilayaChange: (v: string) => void
}

const WILAYAS = [
  'الجزائر', 'وهران', 'قسنطينة', 'عنابة',
  'سطيف', 'باتنة', 'تيزي وزو', 'بجاية',
]

export function OrdersFilters({
  activeTab,
  search,
  wilaya,
  counts,
  onTabChange,
  onSearchChange,
  onWilayaChange,
}: Props) {
  const TABS: { key: OrderStatus | 'all'; label: string; count: number }[] = [
    { key: 'all',       label: 'الكل',            count: counts.all       },
    { key: 'pending',   label: 'بانتظار التأكيد', count: counts.pending   },
    { key: 'shipping',  label: 'مشحونة',          count: counts.shipping  },
    { key: 'delivered', label: 'مُسلّمة',          count: counts.delivered },
    { key: 'returned',  label: 'مرتجعة',          count: counts.returned  },
  ]
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              activeTab === t.key
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === t.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
          placeholder="بحث بالاسم أو رقم الطلبية..."
        />
        <select
          value={wilaya}
          onChange={(e) => onWilayaChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none"
        >
          <option value="">كل الولايات</option>
          {WILAYAS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
    </div>
  )
}