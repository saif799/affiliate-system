// merchant/orders/index.tsx

import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { getMerchantOrders, shipOrder } from './-server/orders.api'
import { OrdersTabs } from './-components/OrdersTabs'
import { OrdersTable } from './-components/OrdersTable'
import { OrderDetailsModal } from './-components/OrderDetailsModal'
import { ShipConfirmModal } from './-components/ShipConfirmModal'
import { InternalLabel } from './-components/InternalLabel'
import { BulkActionBar } from './-components/BulkActionBar'
import { OrdersPagination } from './-components/OrdersPagination'
import type {
  TabFilter,
  DateFilter,
  DbOrderStatus,
  Order,
} from './-orders.types'
import { PageSpinner, PageError } from '#/routes/-components/shared/RouteStates'

// إجراء التاجر الوحيد: شحن الطلبية المؤكَّدة. ما بعد الشحن مصدره شركة التوصيل.
function nextStatus(db: DbOrderStatus): 'shipped' | null {
  if (db === 'confirmed') return 'shipped'
  return null
}

export const Route = createFileRoute('/merchant/orders/')({
  loader: () => getMerchantOrders(),
  pendingComponent: PageSpinner,
  errorComponent: PageError,
  component: MerchantOrdersPage,
})

const PAGE_SIZE = 10

const dateFilterOptions: { label: string; value: DateFilter }[] = [
  { label: 'كل الوقت', value: 'all' },
  { label: 'اليوم', value: 'today' },
  { label: 'هذا الأسبوع', value: 'week' },
  { label: 'هذا الشهر', value: 'month' },
]

function MerchantOrdersPage() {
  const { orders, tabCounts } = Route.useLoaderData()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [isUpdating, setIsUpdating] = useState(false)
  const [search, setSearch] = useState('')
  const [wilayaFilter, setWilayaFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null)
  const [shipTarget, setShipTarget] = useState<Order | null>(null)
  const [labelOrderId, setLabelOrderId] = useState<string | null>(null)

  const wilayas = useMemo(
    () => ['all', ...new Set(orders.map((o) => o.wilaya))],
    [orders],
  )

  // فلترة مجمّعة
  const filteredOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return orders.filter((order) => {
      const matchTab = activeTab === 'all' || order.status === activeTab
      const q = search.trim().toLowerCase()
      const shortId = `ord-${order.id.replace(/-/g, '').slice(0, 8)}`
      const matchSearch =
        q === '' ||
        order.id.toLowerCase().includes(q) ||
        shortId.includes(q) ||
        (order.internalShipmentId?.toLowerCase().includes(q) ?? false) ||
        order.product.name.toLowerCase().includes(q)
      const matchWilaya =
        wilayaFilter === 'all' || order.wilaya === wilayaFilter
      const matchDate = (() => {
        if (dateFilter === 'all') return true
        if (dateFilter === 'today') return order.createdAt === today
        if (dateFilter === 'week') {
          const weekAgo = new Date(Date.now() - 7 * 864e5)
            .toISOString()
            .slice(0, 10)
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
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders = filteredOrders.slice(
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

  // شحن طلبية واحدة بضغطة — يُنشئ الشحنة لدى شركة التوصيل ويجلب رقم التتبّع تلقائياً
  const handleShip = async (orderId: string) => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      await shipOrder({ data: { orderId } })
      setShipTarget(null) // أغلق نافذة التأكيد عند النجاح فقط
      await router.invalidate()
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'فشل إنشاء الشحنة لدى شركة التوصيل',
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // شحن مجموعة طلبيات مؤكَّدة بضغطة واحدة (بلا إدخال يدوي) — تسلسليّاً مع تجميع الأخطاء
  const handleBulkChangeStatus = async () => {
    if (isUpdating) return
    const targets = orders
      .filter(
        (o) => selectedIds.has(o.id) && nextStatus(o.dbStatus) === 'shipped',
      )
      .map((o) => ({ id: o.id, ref: o.internalShipmentId ?? o.id }))
    if (targets.length === 0) {
      alert('لا توجد طلبيات مؤكَّدة قابلة للشحن ضمن المحدد')
      return
    }

    setIsUpdating(true)
    const failures: string[] = []
    try {
      for (const t of targets) {
        try {
          await shipOrder({ data: { orderId: t.id } })
        } catch (e) {
          failures.push(`«${t.ref}»: ${e instanceof Error ? e.message : 'فشل'}`)
        }
      }
      setSelectedIds(new Set())
      await router.invalidate()
      if (failures.length > 0) {
        alert(`تعذّر شحن بعض الطلبيات:\n${failures.join('\n')}`)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة الطلبيات</h1>
          <p className="text-sm text-gray-500">
            متابعة دورة حياة طلبياتك كاملةً
          </p>
        </div>
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
        onPrint={() => window.print()}
        onChangeStatus={handleBulkChangeStatus}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* ─── Filters ─── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
          placeholder="بحث برقم الطلب أو المنتج..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-400 sm:w-64"
        />
        <select
          value={wilayaFilter}
          onChange={(e) =>
            handleFilterChange(() => setWilayaFilter(e.target.value))
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none sm:w-auto"
        >
          <option value="all">كل الولايات</option>
          {wilayas
            .filter((w) => w !== 'all')
            .map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) =>
            handleFilterChange(() =>
              setDateFilter(e.target.value as DateFilter),
            )
          }
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none sm:w-auto"
        >
          {dateFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-gray-400 sm:ms-auto">
          {filteredOrders.length} طلبية
        </span>
      </div>

      {/* ─── Table ─── */}
      <OrdersTable
        orders={pagedOrders}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        onUpdateStatus={(id) => {
          const target = orders.find((o) => o.id === id)
          if (target) setShipTarget(target)
        }}
        onViewDetails={setDetailsOrder}
        onPrintLabel={setLabelOrderId}
        isUpdating={isUpdating}
      />

      {/* ─── Pagination ─── */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* ─── Details + tracking ─── */}
      <OrderDetailsModal
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />

      {/* ─── تأكيد الشحن ─── */}
      <ShipConfirmModal
        order={shipTarget}
        busy={isUpdating}
        onConfirm={() => shipTarget && handleShip(shipTarget.id)}
        onCancel={() => setShipTarget(null)}
      />

      {/* ─── الملصق الداخلي ─── */}
      <InternalLabel
        orderId={labelOrderId}
        onClose={() => setLabelOrderId(null)}
      />
    </div>
  )
}
