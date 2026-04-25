// merchant/orders/index.tsx

import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { getMerchantOrders } from './-server/orders.api'
import { OrdersTabs }       from './-components/OrdersTabs'
import { OrdersTable }      from './-components/OrdersTable'
import { BulkActionBar }    from './-components/BulkActionBar'
import { OrdersPagination } from './-components/OrdersPagination'
import type { TabFilter, DateFilter } from './orders.types'

export const Route = createFileRoute('/merchant/orders/')({
  loader: () => getMerchantOrders(),
  component: MerchantOrdersPage,
})

const PAGE_SIZE = 10

const dateFilterOptions: { label: string; value: DateFilter }[] = [
  { label: 'كل الوقت',     value: 'all'   },
  { label: 'اليوم',        value: 'today' },
  { label: 'هذا الأسبوع', value: 'week'  },
  { label: 'هذا الشهر',   value: 'month' },
]

function MerchantOrdersPage() {
  const { orders, tabCounts } = Route.useLoaderData()

  const [activeTab,    setActiveTab]    = useState<TabFilter>('all')
  const [search,       setSearch]       = useState('')
  const [wilayaFilter, setWilayaFilter] = useState('all')
  const [dateFilter,   setDateFilter]   = useState<DateFilter>('all')
  const [currentPage,  setCurrentPage]  = useState(1)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())

  const wilayas = useMemo(
    () => ['all', ...new Set(orders.map((o) => o.wilaya))],
    [orders],
  )

  // فلترة مجمّعة
  const filteredOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return orders.filter((order) => {
      const matchTab    = activeTab === 'all' || order.status === activeTab
      const matchSearch = search === '' ||
        order.id.includes(search) ||
        order.customer.name.includes(search) ||
        order.product.name.includes(search)
      const matchWilaya = wilayaFilter === 'all' || order.wilaya === wilayaFilter
      const matchDate   = (() => {
        if (dateFilter === 'all') return true
        if (dateFilter === 'today') return order.createdAt === today
        if (dateFilter === 'week') {
          const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
          return order.createdAt >= weekAgo
        }
        if (dateFilter === 'month') {
          return order.createdAt.slice(0, 7) === today.slice(0, 7)
        }
        return true
      })()
      return matchTab && matchSearch && matchWilaya && matchDate
    })
  }, [orders, activeTab, search, wilayaFilter, dateFilter])

  // Pagination
  const totalPages   = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders  = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  const handleFilterChange = (fn: () => void) => {
    fn()
    setCurrentPage(1)
    setSelectedIds(new Set())
  }

  // Bulk actions
  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleToggleAll = (ids: string[]) => {
    setSelectedIds(new Set(ids))
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة الطلبيات</h1>
          <p className="text-sm text-gray-500">متابعة دورة حياة طلبياتك كاملةً</p>
        </div>
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors">
          + طلبية يدوية
        </button>
      </div>

      {/* ─── Tabs ─── */}
      <OrdersTabs
        active={activeTab}
        counts={tabCounts}
        onChange={(tab) => handleFilterChange(() => setActiveTab(tab))}
      />

      {/* ─── Bulk Action Bar (يظهر فقط عند التحديد) ─── */}
      <BulkActionBar
        count={selectedIds.size}
        onPrint={() => console.log('طباعة:', [...selectedIds])}
        onChangeStatus={() => console.log('تغيير حالة:', [...selectedIds])}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
          placeholder="بحث برقم الطلب أو اسم الزبون..."
          className="w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-400"
        />
        <select
          value={wilayaFilter}
          onChange={(e) => handleFilterChange(() => setWilayaFilter(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none"
        >
          <option value="all">كل الولايات</option>
          {wilayas.filter((w) => w !== 'all').map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) =>
            handleFilterChange(() => setDateFilter(e.target.value as DateFilter))
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none"
        >
          {dateFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400">
          {filteredOrders.length} طلبية
        </span>
      </div>

      {/* ─── Table ─── */}
      <OrdersTable
        orders={pagedOrders}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
      />

      {/* ─── Pagination ─── */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

    </div>
  )
}