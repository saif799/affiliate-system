// merchant/dashboard/-components/LowStockAlerts.tsx

import { AlertTriangle } from 'lucide-react'
import type { LowStockProduct } from '../-dashboard.types'

interface LowStockAlertsProps {
  products: LowStockProduct[]
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle size={15} className="text-orange-500" />
        <h2 className="text-sm font-semibold text-gray-800">
          تنبيهات المخزون
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {products.map((product) => {
          const isCritical = product.stockQuantity <= 2
          return (
            <div
              key={product.id}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 ${
                isCritical ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'
              }`}
            >
              <span className={`truncate text-xs font-medium ${
                isCritical ? 'text-red-700' : 'text-orange-700'
              }`}>
                {product.name}
              </span>
              <span className={`shrink-0 whitespace-nowrap text-xs font-bold ${
                isCritical ? 'text-red-600' : 'text-orange-600'
              }`}>
                {product.stockQuantity} متبقية
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}