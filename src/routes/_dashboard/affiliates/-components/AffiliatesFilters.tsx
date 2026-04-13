import type { AffiliateStatus } from '../affiliates.types'

interface Props {
  search: string
  onSearch: (v: string) => void
  status: AffiliateStatus | 'all'
  onStatus: (v: AffiliateStatus | 'all') => void
  wilaya: string
  onWilaya: (v: string) => void
  wilayas: string[]
}

const statusOptions: { label: string; value: AffiliateStatus | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'نشط', value: 'active' },
  { label: 'معلق', value: 'suspended' },
  { label: 'قيد الانتظار', value: 'pending' },
]

export function AffiliatesFilters({
  search,
  onSearch,
  status,
  onStatus,
  wilaya,
  onWilaya,
  wilayas,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="البحث بالاسم..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 min-w-45 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
      />

      <div className="flex gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatus(opt.value)}
            className={`text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
              status === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <select
        value={wilaya}
        onChange={(e) => onWilaya(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
      >
        <option value="all">كل الولايات</option>
        {wilayas.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </div>
  )
}
