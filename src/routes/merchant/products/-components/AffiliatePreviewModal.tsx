// merchant/products/-components/AffiliatePreviewModal.tsx

import { X, ImageIcon } from 'lucide-react'
import type { Product } from '../-products.types'

interface AffiliatePreviewModalProps {
  product: Product | null
  onClose: () => void
}

export function AffiliatePreviewModal({
  product,
  onClose,
}: AffiliatePreviewModalProps) {
  if (!product) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-purple-600">معاينة كمسوق</p>
            <p className="text-sm font-semibold text-gray-800">
              كيف يرى المسوق منتجك؟
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* بطاقة المنتج */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          {/* صورة + اسم */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-300">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={20} />
              )}
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-gray-800">
                {product.name}
              </p>
              <p className="truncate text-xs text-gray-400">{product.category}</p>
            </div>
          </div>

          {/* معرض الصور */}
          {product.images.length > 1 && (
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {product.images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover"
                />
              ))}
            </div>
          )}

          {/* سعر الجملة */}
          <div className="rounded-lg bg-white p-3 text-center">
            <p className="text-xs text-gray-400">سعر الجملة (ما يقبضه التاجر)</p>
            <p className="text-sm font-bold text-gray-800">
              {product.basePrice.toLocaleString('ar-DZ')} DZD
            </p>
          </div>

          {/* الوصف */}
          {product.description && (
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              {product.description}
            </p>
          )}
        </div>

        {/* تنبيه للتاجر */}
        <div className="mt-4 rounded-lg bg-purple-50 px-3 py-2.5">
          <p className="text-xs text-purple-700">
            💡 هذا هو ما يراه المسوق. وصف أفضل = مسوقون أكثر = مبيعات أكثر.
          </p>
        </div>
      </div>
    </div>
  )
}
