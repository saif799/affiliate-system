import { Search} from 'lucide-react'
import type { MarketplaceFilters, ProductCategory } from '../-marketplace.types'

interface Props {
  filters: MarketplaceFilters
  onChange: (filters: MarketplaceFilters) => void
  totalShown: number
  totalAll: number
}

const categories: Array<ProductCategory | 'الكل'> = [
  'الكل', 'إلكترونيات', 'ملابس', 'تجميل', 'رياضة', 'أطفال', 'منزل', 'صحة',
]

const sortOptions: Array<{ value: MarketplaceFilters['sortBy']; label: string }> = [
  { value: 'commission', label: 'أعلى عمولة' },
  { value: 'deliveredRate', label: 'أفضل معدل استلام' },
  { value: 'totalSales', label: 'الأكثر مبيعاً' },
  { value: 'newest', label: 'الأحدث' },
]

export function MarketplaceFiltersBar({ filters, onChange, totalShown, totalAll }: Props) {
  return (
    <div className="flex flex-col gap-3">

      {/* Row 1: Search + Sort + Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="ابحث عن منتج أو تاجر..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-xs outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as MarketplaceFilters['sortBy'] })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors select-none">
          <div
            className={`relative h-4 w-7 rounded-full transition-colors ${
              filters.hideHighRetour ? 'bg-red-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
                filters.hideHighRetour ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={filters.hideHighRetour}
            onChange={(e) => onChange({ ...filters, hideHighRetour: e.target.checked })}
          />
          إخفاء روتور {'>'}25%
        </label>

        <span className="text-xs text-gray-400 mr-auto">
          {totalShown} من {totalAll} منتج
        </span>
      </div>

      {/* Row 2: Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange({ ...filters, category: cat })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.category === cat
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}