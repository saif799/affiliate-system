import { useState } from 'react'
import type { Product } from '../-campaigns.types'

interface Props {
  products: Product[]
}

// ─── sub-components ──────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      نشط
    </span>
  ) : (
    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
      موقوف
    </span>
  )
}

function ReturnBar({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-xs text-gray-400">—</span>

  const barColor =
    rate >= 60 ? 'bg-red-500' :
    rate >= 30 ? 'bg-yellow-400' :
                 'bg-green-500'

  const textColor =
    rate >= 60 ? 'text-red-600 font-semibold' :
    rate >= 30 ? 'text-yellow-600' :
                 'text-gray-700'

  return (
    <div>
      <span className={`text-xs ${textColor}`}>
        {rate}%{rate >= 30 && ' ⚠️'}
      </span>
      <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100">
        <div
          className={`h-1.5 rounded-full ${barColor}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  )
}

// ─── filter config ───────────────────────────────────────────

type FilterKey = 'all' | 'active' | 'suspended' | 'high_return'

const FILTERS: { label: string; value: FilterKey }[] = [
  { label: 'الكل',          value: 'all'         },
  { label: 'نشط',           value: 'active'      },
  { label: 'موقوف',         value: 'suspended'   },
  { label: '⚠️ إرجاع مرتفع', value: 'high_return' },
]

// ─── detail drawer ────────────────────────────────────────────

function ProductDrawer({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const rows: [string, string][] = [
    ['التاجر',         product.merchantName],
    ['الولاية',        product.merchantWilaya],
    ['الفئة',          product.category ?? '—'],
    ['السعر',          `${product.priceDzd.toLocaleString('fr-DZ')} DZD`],
    ['المخزون',        `${product.stockQty} وحدة`],
    ['التحويلات',      product.conversions === 0 ? '—' : product.conversions.toString()],
    ['نسبة الإرجاع',   `${product.returnRate}%`],
    ['تاريخ الإضافة',  product.createdAt],
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/40"
      onClick={onClose}
    >
      <div
        className="h-full w-96 overflow-y-auto bg-white p-6 shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drawer header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
              {product.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{product.name}</h2>
              <p className="text-xs text-gray-400">{product.merchantName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* status */}
        <div className="mb-4">
          <StatusBadge isActive={product.isActive} />
        </div>

        {/* rows */}
        <div className="flex flex-col gap-0">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b border-gray-50 py-2.5 text-sm"
            >
              <span className="text-gray-400">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* low stock warning */}
        {product.stockQty < 5 && (
          <div className="mt-4 rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
            ⚠️ المخزون منخفض جداً ({product.stockQty} وحدات متبقية)
          </div>
        )}

        {/* high return warning */}
        {product.returnRate >= 30 && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            🚨 نسبة الإرجاع تتجاوز 30% — يُنصح بمراجعة جودة المنتج أو تفاصيل العرض
          </div>
        )}

        {/* actions */}
        <div className="mt-6 flex gap-2">
          {product.isActive ? (
            <button
              type="button"
              className="flex-1 rounded-lg bg-yellow-100 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
            >
              إيقاف المنتج
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 rounded-lg bg-green-100 py-2 text-xs font-medium text-green-700 hover:bg-green-200"
            >
              تفعيل المنتج
            </button>
          )}
          <button
            type="button"
            className="flex-1 rounded-lg bg-red-100 py-2 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            حذف نهائي
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────

const PAGE_SIZE = 10

export function ProductsTable({ products }: Props) {
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState<FilterKey>('all')
  const [selected,   setSelected]   = useState<Product | null>(null)
  const [page,       setPage]       = useState(1)

  // ── filtering ──
  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      p.name.includes(q) ||
      p.merchantName.toLowerCase().includes(q) ||
      (p.merchantWilaya?.toLowerCase().includes(q) ?? false) ||
      (p.category?.toLowerCase().includes(q) ?? false)

    const matchFilter =
      filter === 'all'         ? true :
      filter === 'active'      ? p.isActive :
      filter === 'suspended'   ? !p.isActive :
      /* high_return */          p.returnRate >= 30

    return matchSearch && matchFilter
  })

  // ── pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function handleFilterChange(f: FilterKey) {
    setFilter(f)
    setPage(1)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <>
      {/* ─── filters bar ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="min-w-56 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          placeholder="ابحث باسم المنتج أو التاجر أو الولاية أو الفئة..."
          value={search}
          onChange={handleSearchChange}
          dir="rtl"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── table ─────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              <th className="px-4 py-3 text-xs font-medium text-gray-400">المنتج / التاجر</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">الفئة</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">المخزون</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">الحالة</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">التحويلات</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">نسبة الإرجاع</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                  لا توجد نتائج مطابقة
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 text-right last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* product + merchant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-400">
                          {p.merchantName} — {p.merchantWilaya}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* category */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.category ?? '—'}
                  </td>

                  {/* stock */}
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stockQty < 5
                          ? 'text-red-500 font-semibold text-xs'
                          : 'text-gray-700 text-sm'
                      }
                    >
                      {p.stockQty < 5 ? `${p.stockQty} ⚠️` : p.stockQty}
                    </span>
                  </td>

                  {/* status */}
                  <td className="px-4 py-3">
                    <StatusBadge isActive={p.isActive} />
                  </td>

                  {/* conversions */}
                  <td className="px-4 py-3 text-gray-700">
                    {p.conversions === 0 ? '—' : p.conversions}
                  </td>

                  {/* return rate */}
                  <td className="px-4 py-3">
                    <ReturnBar rate={p.returnRate} />
                  </td>

                  {/* actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelected(p)}
                        className="rounded-md border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
                      >
                        عرض
                      </button>
                      {p.isActive ? (
                        <button
                          type="button"
                          className="rounded-md bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
                        >
                          إيقاف
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                        >
                          تفعيل
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── pagination ────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="text-xs">
            عرض {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} من {filtered.length} منتج
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-200 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
            >
              السابق
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={[
                  'rounded-md px-3 py-1 text-xs',
                  n === currentPage
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-200 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* ─── detail drawer ─────────────────────────── */}
      {selected && (
        <ProductDrawer product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}