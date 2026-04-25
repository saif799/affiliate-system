// merchant/products/-components/ProductsTable.tsx

import { AlertTriangle } from 'lucide-react'
import type { Product, ProductStatus } from '../products.types'

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  active:       { label: 'نشط',         className: 'bg-green-100 text-green-800' },
  paused:       { label: 'متوقف',       className: 'bg-gray-100  text-gray-600'  },
  out_of_stock: { label: 'نفد المخزون', className: 'bg-red-100   text-red-800'   },
}

interface ProductsTableProps {
  products: Product[]
  onToggleActive: (id: string) => void
  onPreview: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductsTable({
  products,
  onToggleActive,
  onPreview,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const renderStock = (product: Product) => {
    if (product.stockQuantity === 0) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          نفد المخزون
        </span>
      )
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
          <AlertTriangle size={11} />
          {product.stockQuantity} وحدة
        </span>
      )
    }
    return (
      <span className="text-xs font-medium text-gray-800">
        {product.stockQuantity} وحدة
      </span>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-400">لا توجد منتجات في هذه الفئة</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="w-12 px-4 py-3" />
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المنتج</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المخزون</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">سعر الجملة</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">سعر البيع المقترح</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">تفعيل</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const status = statusConfig[product.status]
            return (
              <tr
                key={product.id}
                className={`transition-colors hover:bg-gray-50 ${
                  index === products.length - 1 ? '' : 'border-b border-gray-50'
                }`}
              >
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-lg">
                    {product.thumbnail}
                  </div>
                </td>

                {/* المنتج */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{product.name}</p>
                  <p className="font-mono text-xs text-gray-400">{product.sku}</p>
                  <p className="text-xs text-gray-400">{product.category}</p>
                </td>

                {/* المخزون */}
                <td className="px-4 py-3">{renderStock(product)}</td>

                {/* سعر الجملة */}
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-gray-800">
                    {product.basePrice.toLocaleString('ar-DZ')} DZD
                  </span>
                </td>

                {/* سعر البيع المقترح */}
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600">
                    {product.msrpPrice.toLocaleString('ar-DZ')} DZD
                  </span>
                  <p className="text-xs text-gray-400">
                    حد أدنى: {product.minSellingPrice.toLocaleString('ar-DZ')}
                  </p>
                </td>

                {/* الحالة */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>

                {/* Toggle */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleActive(product.id)}
                    className={`relative h-5 w-8 rounded-full transition-colors ${
                      product.isActive ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                        product.isActive ? 'left-3.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </td>

                {/* الإجراءات */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(product)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => onPreview(product)}
                      className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-700 transition-colors hover:bg-purple-100"
                    >
                      معاينة كمسوق
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs text-red-500 transition-colors hover:bg-red-100"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}