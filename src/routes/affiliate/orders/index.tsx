import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getAffiliateOrders } from './-server/orders.api'
import { OrdersStats } from './-components/OrdersStats'
import { OrdersFilters } from './-components/OrdersFilters'
import { OrdersTable } from './-components/OrdersTable'
import { AddLeadModal } from './-components/AddLeadModal'
import type { OrderStatus, AddLeadForm } from './orders.types'

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

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

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

  function handleAddLead(form: AddLeadForm) {
    // لاحقاً: استدعاء addLeadManual(form)
    console.log('New lead submitted:', form)
  }

  return (
    <div className="flex flex-col gap-5 p-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">طلبياتي</h1>
          <p className="text-sm text-gray-500">تتبع حالة كل طلبية وأضف عملاءك يدوياً</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700"
        >
          + إضافة طلبية يدوية
        </button>
      </div>

      {/* Stats */}
      <OrdersStats stats={stats} />

      {/* Tabs + Filters */}
      <OrdersFilters
        activeTab={activeTab}
        search={search}
        wilaya={wilaya}
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
      />

      {/* Modal */}
      <AddLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddLead}
      />
    </div>
  )
}