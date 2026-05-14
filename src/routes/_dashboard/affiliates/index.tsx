import { createFileRoute } from '@tanstack/react-router'
import { getAffiliatesData } from './-server/affiliates.api'
import { AffiliateStatsBar } from './-components/AffiliateStatsBar'
import { AffiliatesFilters } from './-components/AffiliatesFilters'
import { AffiliatesTable } from './-components/AffiliatesTable'
import { useState } from 'react'
import type { AffiliateStatus } from './-affiliates.types'

export const Route = createFileRoute('/_dashboard/affiliates/')({
  loader: () => getAffiliatesData(),
  pendingComponent: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
  component: AffiliatesPage,
})

function AffiliatesPage() {
  const data = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | 'all'>(
    'all',
  )
  const [wilayaFilter, setWilayaFilter] = useState('all')

  const filtered = data.affiliates.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    const matchWilaya = wilayaFilter === 'all' || a.wilaya === wilayaFilter
    return matchSearch && matchStatus && matchWilaya
  })

  const wilayas = [...new Set(data.affiliates.map((a) => a.wilaya))]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">المسوقون</h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة ومتابعة جميع المسوقين
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + إضافة مسوق
        </button>
      </div>

      <AffiliateStatsBar
        total={data.totalAffiliates}
        active={data.activeAffiliates}
        commissions={data.totalCommissionsPaid}
      />

      <AffiliatesFilters
        search={search}
        onSearch={setSearch}
        status={statusFilter}
        onStatus={setStatusFilter}
        wilaya={wilayaFilter}
        onWilaya={setWilayaFilter}
        wilayas={wilayas}
      />

      <AffiliatesTable affiliates={filtered} />
    </div>
  )
}
