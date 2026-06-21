// src/routes/_dashboard/-shared/-components/UserFilters.tsx
import type { UserStatus } from '../-shared.types'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'الكل'          },
  { value: 'active',    label: 'نشط'           },
  { value: 'suspended', label: 'موقوف'         },
  { value: 'pending',   label: 'قيد الانتظار' },
] as const

interface Props {
  search: string
  filter: UserStatus | 'all'
  onSearch: (v: string) => void
  onFilter: (v: UserStatus | 'all') => void
  placeholder?: string
}

export function UserFilters({
  search,
  filter,
  onSearch,
  onFilter,
  placeholder = 'البحث بالاسم أو البريد...',
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 min-w-0 sm:min-w-48">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-visible">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilter(value)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}