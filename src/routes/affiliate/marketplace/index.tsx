import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { getMarketplaceData } from './-server/marketplace.api'
import { ProductCard } from './-components/ProductCard'
import { QuickViewModal } from './-components/QuickViewModal'
import { MarketplaceFiltersBar } from './-components/MarketplaceFiltersBar'
import type { Product, MarketplaceFilters } from './-marketplace.types'
import { AddLeadModal } from '../orders/-components/AddLeadModal'
import { addLeadManual } from '../orders/-server/orders.api'
import type { AddLeadForm, LeadProduct } from '../orders/-orders.types'

export const Route = createFileRoute('/affiliate/marketplace/')({
  loader: () => getMarketplaceData(),
  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      جاري التحميل...
    </div>
  ),
  component: MarketplacePage,
})

function MarketplacePage() {
  const data = Route.useLoaderData()
  const router = useRouter()

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [leadProduct, setLeadProduct] = useState<LeadProduct | null>(null)
  const [leadDone, setLeadDone] = useState(false)
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    category: 'الكل',
    sortBy: 'newest',
    hideHighRetour: false,
  })

  const filteredProducts = useMemo(() => {
    let result = [...data.products]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.merchantName.toLowerCase().includes(q) ||
          p.category.includes(q),
      )
    }

    if (filters.category !== 'الكل') {
      result = result.filter((p) => p.category === filters.category)
    }

    if (filters.hideHighRetour) {
      result = result.filter((p) => p.retourRate <= 25)
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'priceLow':       return a.basePrice - b.basePrice
        case 'deliveredRate':  return b.deliveredRate - a.deliveredRate
        case 'totalSales':     return b.totalSales - a.totalSales
        case 'newest':
        default:               return 0
      }
    })

    return result
  }, [data.products, filters])

  function openLeadForm(p: Product) {
    setSelectedProduct(null)
    setLeadProduct({ id: p.id, name: p.name, basePrice: p.basePrice })
  }

  // يرمي عند الفشل ليعرضه AddLeadModal داخليّاً ويبقى مفتوحاً؛ المودال يُغلق نفسه عند النجاح
  async function handleAddLead(form: AddLeadForm) {
    await addLeadManual({ data: form })
    setLeadDone(true)
    setTimeout(() => setLeadDone(false), 4000)
    await router.invalidate()
  }

  return (
    <div className="space-y-5 p-6" dir="rtl">

      {leadDone && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          ✓ تم إنشاء الطلبية — ستجدها في صفحة «طلبياتي» بانتظار تأكيدك
        </div>
      )}


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">سوق المنتجات</h1>
          <p className="text-sm text-gray-500">اختر المنتج وولّد رابطك في ثوانٍ</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center">
            <p className="text-xs text-gray-400">متوسط سعر الجملة</p>
            <p className="text-sm font-bold text-gray-900">{data.stats.avgBasePrice.toLocaleString("ar-DZ")} د.ج</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-center">
            <p className="text-xs text-violet-400">أقل سعر جملة</p>
            <p className="text-sm font-bold text-violet-700">{data.stats.minBasePrice.toLocaleString("ar-DZ")} د.ج</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <MarketplaceFiltersBar
        filters={filters}
        onChange={setFilters}
        categories={data.categories}
        totalShown={filteredProducts.length}
        totalAll={data.products.length}
      />

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-400">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm">لا توجد منتجات تطابق الفلتر</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenModal={setSelectedProduct}
            />
          ))}
        </div>
      )}

      {/* Quick view */}
      <QuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddOrder={openLeadForm}
      />

      {/* Manual order for a chosen product */}
      <AddLeadModal
        open={leadProduct !== null}
        onClose={() => setLeadProduct(null)}
        onSubmit={handleAddLead}
        products={leadProduct ? [leadProduct] : []}
        initialProductId={leadProduct?.id}
      />
    </div>
  )
}