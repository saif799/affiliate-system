// merchant/dashboard/-components/TopProducts.tsx

import { Trophy } from 'lucide-react'
import type { TopProduct } from '../-dashboard.types'

interface TopProductsProps {
  products: TopProduct[]
}

export function TopProducts({ products }: TopProductsProps) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={15} className="text-yellow-500" />
        <h2 className="text-sm font-semibold text-gray-800">
          أفضل المنتجات مبيعاً
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{medals[index]}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-gray-800">
                  {product.name}
                </span>
                <span className="text-xs text-gray-400">
                  {product.totalSold} وحدة مباعة
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-green-600">
              {product.revenue.toLocaleString('ar-DZ')} DZD
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}