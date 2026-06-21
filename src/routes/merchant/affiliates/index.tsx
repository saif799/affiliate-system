// src/routes/merchant/affiliates/index.tsx

import { useState, useMemo } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getAffiliatesData, blockAffiliate, unblockAffiliate } from './-server/affiliates.api'
import { AffiliateKPIs } from './-components/AffiliateKPIs'
import { AffiliatesFilters } from './-components/AffiliatesFilters'
import { AffiliatesTable } from './-components/AffiliatesTable'
import { AffiliateDrawer } from './-components/AffiliateDrawer'
import type { Affiliate, FilterStatus, SortKey } from './-affiliates.types'

export const Route = createFileRoute('/merchant/affiliates/')({
  loader: () => getAffiliatesData(),
  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      جاري التحميل...
    </div>
  ),
  component: AffiliatesPage,
})

function AffiliatesPage() {
  const data = Route.useLoaderData()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortKey, setSortKey] = useState<SortKey>('topSales')
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [affiliates, setAffiliates] = useState(data.affiliates)

  const filtered = useMemo(() => {
    let list = [...affiliates]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) => a.name.includes(q) || a.phone.includes(q)
      )
    }

    if (filterStatus !== 'all') {
      list = list.filter((a) => a.status === filterStatus)
    }

    list.sort((a, b) => {
      if (sortKey === 'topSales') return b.totalSales - a.totalSales
      if (sortKey === 'topCommission') return b.totalCommissions - a.totalCommissions
      if (sortKey === 'highestReturn') return b.returnRate - a.returnRate
      if (sortKey === 'newest') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      return 0
    })

    return list
  }, [affiliates, search, filterStatus, sortKey])

  async function handleBlock(id: string) {
    try {
      await blockAffiliate({ data: { affiliateProfileId: id } })
      setAffiliates((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'blocked' as const } : a))
      )
      setSelectedAffiliate((prev) =>
        prev?.id === id ? { ...prev, status: 'blocked' as const } : prev
      )
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل حظر المسوق')
    }
  }

  async function handleUnblock(id: string) {
    try {
      await unblockAffiliate({ data: { affiliateProfileId: id } })
      setAffiliates((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'active' as const } : a))
      )
      setSelectedAffiliate((prev) =>
        prev?.id === id ? { ...prev, status: 'active' as const } : prev
      )
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل رفع الحظر')
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">شبكة المسوقين</h1>
          <p className="text-sm text-gray-500">تابع أداء المسوقين المرتبطين بمنتجاتك</p>
        </div>
      </div>

      {/* KPIs */}
      <AffiliateKPIs stats={data.stats} />

      {/* Filters */}
      <AffiliatesFilters
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
      />

      {/* Table */}
      <AffiliatesTable
        affiliates={filtered}
        onSelect={setSelectedAffiliate}
      />

      {/* Drawer */}
      <AffiliateDrawer
        affiliate={selectedAffiliate}
        onClose={() => setSelectedAffiliate(null)}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
      />
    </div>
  )
}