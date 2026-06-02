// merchant/orders/-components/OrdersTabs.tsx

import type { TabFilter, OrdersTabCount } from '../-orders.types'

const tabs: { label: string; value: TabFilter; urgent?: boolean }[] = [
  { label: 'الكل',       value: 'all'       },
  { label: 'للتغليف',    value: 'pending',  urgent: true },
  { label: 'قيد الشحن',  value: 'shipped'   },
  { label: 'مكتملة',     value: 'delivered' },
  { label: 'مسترجعة',    value: 'returned'  },
]

interface OrdersTabsProps {
  active: TabFilter
  counts: OrdersTabCount
  onChange: (tab: TabFilter) => void
}

export function OrdersTabs({ active, counts, onChange }: OrdersTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
      {tabs.map((tab) => {
        const isActive = active === tab.value
        const count = counts[tab.value]
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
              isActive
                ? 'bg-white/20 text-white'
                : tab.urgent
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}