// src/routes/merchant/affiliates/-components/AffiliatesFilters.tsx

import type { FilterStatus, SortKey } from '../affiliates.types'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  filterStatus: FilterStatus
  onFilterStatusChange: (v: FilterStatus) => void
  sortKey: SortKey
  onSortKeyChange: (v: SortKey) => void
}

export function AffiliatesFilters({
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortKey,
  onSortKeyChange,
}: Props) {
  return (
    <div className="flex items-end gap-3">
      {/* بحث */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">بحث</label>
        <div className="relative">
          <svg
            className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            dir="rtl"
            type="text"
            className="h-9 w-64 rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-0"
            placeholder="ابحث باسم المسوق أو هاتفه..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* فلتر الحالة */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">الحالة</label>
        <select
          dir="rtl"
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none focus:border-gray-400 appearance-none cursor-pointer"
          style={{ paddingLeft: '2rem', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 8px center', backgroundSize: '14px' }}
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="blocked">محظور</option>
        </select>
      </div>

      {/* ترتيب */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">ترتيب حسب</label>
        <select
          dir="rtl"
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none focus:border-gray-400 appearance-none cursor-pointer"
          style={{ paddingLeft: '2rem', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 8px center', backgroundSize: '14px' }}
          value={sortKey}
          onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
        >
          <option value="topSales">الأعلى مبيعاً</option>
          <option value="newest">الأحدث انضماماً</option>
          <option value="topCommission">الأعلى عمولة</option>
          <option value="highestReturn">الأعلى روتور</option>
        </select>
      </div>
    </div>
  )
}