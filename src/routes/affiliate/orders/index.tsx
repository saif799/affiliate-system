import { useState, useMemo } from 'react'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { getAffiliateOrders, confirmLead, rejectLead } from './-server/orders.api'
import { OrdersStats } from './-components/OrdersStats'
import { OrdersFilters } from './-components/OrdersFilters'
import { OrdersTable } from './-components/OrdersTable'
import { OrderDetailsModal } from './-components/OrderDetailsModal'
import { EditOrderModal } from './-components/EditOrderModal'
import type { OrderStatus, AffiliateOrder } from './-orders.types'

const PER_PAGE = 8

export const Route = createFileRoute('/affiliate/orders/')({
  loader: () => getAffiliateOrders(),
  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      جاري التحميل...
    </div>
  ),
  component: AffiliateOrdersPage,
})

function AffiliateOrdersPage() {
  const { orders, stats } = Route.useLoaderData()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<AffiliateOrder | null>(null)
  const [editOrderId, setEditOrderId] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      returned: orders.filter((o) => o.status === 'returned').length,
    }),
    [orders],
  )

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const tabOk = activeTab === 'all' || o.status === activeTab
      const searchOk =
        !search ||
        o.id.includes(search) ||
        o.customer.includes(search) ||
        o.product.includes(search)
      const wilayaOk = !wilaya || o.wilaya === wilaya
      return tabOk && searchOk && wilayaOk
    })
  }, [orders, activeTab, search, wilaya])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function handleTabChange(tab: OrderStatus | 'all') {
    setActiveTab(tab)
    setPage(1)
  }

  function handleSearchChange(v: string) {
    setSearch(v)
    setPage(1)
  }

  function handleWilayaChange(v: string) {
    setWilaya(v)
    setPage(1)
  }

  async function handleConfirm(rawId: string) {
    setBusyId(rawId)
    try {
      await confirmLead({ data: { orderId: rawId } })
      setSelectedOrder(null)
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل تأكيد الطلبية')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(rawId: string) {
    setBusyId(rawId)
    try {
      await rejectLead({ data: { orderId: rawId } })
      setSelectedOrder(null)
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل رفض الطلبية')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">طلبياتي</h1>
        <p className="text-sm text-gray-500">
          تتبّع حالة كل طلبية — لإضافة طلبية يدوية اختر المنتج من{' '}
          <Link to="/affiliate/marketplace" className="font-medium text-violet-600 hover:underline">
            سوق المنتجات
          </Link>
        </p>
      </div>

      {/* Stats */}
      <OrdersStats stats={stats} />

      {/* Tabs + Filters */}
      <OrdersFilters
        activeTab={activeTab}
        search={search}
        wilaya={wilaya}
        counts={counts}
        onTabChange={handleTabChange}
        onSearchChange={handleSearchChange}
        onWilayaChange={handleWilayaChange}
      />

      {/* Table */}
      <OrdersTable
        orders={paginated}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onView={setSelectedOrder}
        onEdit={setEditOrderId}
        busyId={busyId}
      />

      {/* Order details + tracking */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onConfirm={handleConfirm}
        onReject={handleReject}
        busy={busyId === selectedOrder?.rawId}
      />

      {/* Edit order */}
      <EditOrderModal
        orderId={editOrderId}
        onClose={() => setEditOrderId(null)}
        onSaved={() => router.invalidate()}
      />
    </div>
  )
}