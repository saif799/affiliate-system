import type { Product, ProductStatus } from '../-marketplace.types'

interface Props {
  product: Product
  onOpenModal: (product: Product) => void
}

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  active: { label: '✅ متاح', className: 'bg-green-100 text-green-700' },
  limited: { label: '⚠️ كمية محدودة', className: 'bg-amber-100 text-amber-700' },
}

export function ProductCard({ product, onOpenModal }: Props) {
  const status = statusConfig[product.status]
  const retourDanger = product.retourRate > 25

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden transition-all hover:border-gray-300 hover:shadow-md cursor-pointer"
      onClick={() => onOpenModal(product)}
    >
      {/* Thumbnail */}
      <div className="relative flex h-36 items-center justify-center bg-gray-50 border-b border-gray-100 overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl">📦</span>
        )}
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
        {product.videoUrl && (
          <span className="absolute top-2 left-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
            📹 فيديو
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div>
          <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
          <p className="mt-0.5 text-xs text-gray-400">{product.merchantName} · {product.category}</p>
        </div>

        {/* سعر الجملة — الأبرز */}
        <div className="rounded-lg bg-violet-50 px-3 py-2 text-center">
          <p className="text-xs text-violet-500">سعر الجملة (تكلفتك)</p>
          <p className="mt-0.5 text-lg font-bold text-violet-700">
            {product.basePrice.toLocaleString('ar-DZ')} د.ج
          </p>
          <p className="text-xs text-violet-400">بِع بأي سعر — ربحك = سعرك − الجملة</p>
        </div>

        {/* Rates */}
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700">{product.deliveredRate}%</p>
              <p className="text-xs text-green-500">استلام</p>
            </div>
          </div>
          <div className={`flex flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${retourDanger ? 'bg-red-50' : 'bg-gray-50'}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${retourDanger ? 'bg-red-500' : 'bg-gray-400'}`} />
            <div>
              <p className={`text-xs font-semibold ${retourDanger ? 'text-red-700' : 'text-gray-600'}`}>{product.retourRate}%</p>
              <p className={`text-xs ${retourDanger ? 'text-red-400' : 'text-gray-400'}`}>روتور</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-auto flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">{product.totalSales.toLocaleString('ar-DZ')} مبيعة</span>
          <button
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            onClick={(e) => { e.stopPropagation(); onOpenModal(product) }}
          >
            عرض وتوليد رابط
          </button>
        </div>
      </div>
    </div>
  )
}
