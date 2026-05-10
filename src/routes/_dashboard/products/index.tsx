import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getProductsData }  from './-server/campaigns.api'
import { ProductStatsCard } from './-components/ProductStatsCard'
import { ProductsTable }    from './-components/ProductsTable'
import type { ProductStats } from './-campaigns.types'

export const Route = createFileRoute('/_dashboard/products/')({
  loader: () => getProductsData(),

  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
    </div>
  ),

  component: ProductsPage,
})

// ─── stat cards config ────────────────────────────────────────

const STAT_CARDS: {
  key:     keyof ProductStats
  label:   string
  icon:    string
  danger?: boolean
}[] = [
  { key: 'total',           label: 'إجمالي المنتجات', icon: '📦'               },
  { key: 'active',          label: 'نشطة حالياً',     icon: '✅'               },
  { key: 'suspended',       label: 'موقوفة',          icon: '🚫'               },
  { key: 'highReturnCount', label: 'إرجاع مرتفع',     icon: '⚠️', danger: true },
]

// ─── page component ───────────────────────────────────────────

function ProductsPage() {
  const { stats, products } = useLoaderData({ from: '/_dashboard/products/' })

  return (
    <div className="flex flex-col gap-4 p-5" dir="rtl">

      {/* header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">المنتجات</h1>
        <p className="text-xs text-gray-400">
          مراقبة وإدارة منتجات التجار على المنصة
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <ProductStatsCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            metric={stats[card.key]}
            danger={card.danger}
          />
        ))}
      </div>

      {/* table + filters */}
      <ProductsTable products={products} />

    </div>
  )
}