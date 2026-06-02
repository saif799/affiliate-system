// merchant/products/-components/ProductStatsBar.tsx

import type { ProductsStats } from '../-products.types'

interface ProductStatsBarProps {
  stats: ProductsStats
}

export function ProductStatsBar({ stats }: ProductStatsBarProps) {
  const cards = [
    {
      label: 'إجمالي المنتجات',
      value: String(stats.total),
      color: 'text-gray-900',
    },
    {
      label: 'منتجات نشطة',
      value: String(stats.active),
      color: 'text-green-600',
    },
    {
      label: 'نفد المخزون',
      value: String(stats.outOfStock),
      color: stats.outOfStock > 0 ? 'text-red-600' : 'text-gray-900',
    },
    {
      label: 'قيمة المخزون',
      value: `${(stats.inventoryValue / 1_000_000).toFixed(1)}M DZD`,
      color: 'text-gray-900',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3.5"
        >
          <p className="text-xs text-gray-500">{card.label}</p>
          <p className={`mt-1.5 text-xl font-bold ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}