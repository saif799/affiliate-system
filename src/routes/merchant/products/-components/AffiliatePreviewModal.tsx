// merchant/products/-components/AffiliatePreviewModal.tsx

import { X, ExternalLink } from 'lucide-react'
import type { Product } from '../products.types'

interface AffiliatePreviewModalProps {
  product: Product | null
  onClose: () => void
}

export function AffiliatePreviewModal({
  product,
  onClose,
}: AffiliatePreviewModalProps) {
  if (!product) return null

  const commission = product.msrpPrice - product.basePrice
  const commissionRate = Math.round((commission / product.msrpPrice) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-96 rounded-2xl border border-gray-200 bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-purple-600">معاينة كمسوق</p>
            <p className="text-sm font-semibold text-gray-800">
              كيف يرى المسوق منتجك؟
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* بطاقة المنتج */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          {/* صورة + اسم */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl">
              {product.thumbnail}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {product.name}
              </p>
              <p className="text-xs text-gray-400">{product.category}</p>
            </div>
          </div>

          {/* سعر البيع + العمولة */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xs text-gray-400">سعر البيع</p>
              <p className="text-sm font-bold text-gray-800">
                {product.msrpPrice.toLocaleString('ar-DZ')} DZD
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xs text-green-600">عمولتك</p>
              <p className="text-sm font-bold text-green-700">
                {commission.toLocaleString('ar-DZ')} DZD
              </p>
              <p className="text-xs text-green-500">
                {commissionRate}% من السعر
              </p>
            </div>
          </div>

          {/* الحد الأدنى */}
          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-700">
              ⚠️ الحد الأدنى للبيع:{' '}
              <span className="font-semibold">
                {product.minSellingPrice.toLocaleString('ar-DZ')} DZD
              </span>
            </p>
          </div>

          {/* الوصف */}
          {product.description && (
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              {product.description}
            </p>
          )}

          {/* رابط الميديا */}
          {product.mediaFolderUrl && (
            <a
              href={product.mediaFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink size={11} />
              مجلد الفيديوهات الإعلانية
            </a>
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
