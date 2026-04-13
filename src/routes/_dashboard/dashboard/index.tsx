import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getDashboardData } from './-server/dashboard.api'
import { StatsCard } from './-components/StatsCard'
import { OverviewChart } from './-components/OverviewChart'
import { TopAffiliates } from './-components/TopAffiliates'
import { WilayaChart } from './-components/WilayaChart'
import { RecentActivity } from './-components/RecentActivity'

export const Route = createFileRoute('/_dashboard/dashboard/')({
  loader: () => getDashboardData(),

  pendingComponent: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
  component: DashboardPage,
})

const statCards = [
  {
    key: 'totalMerchants',
    label: 'المتاجر المسجّلة',
    icon: '🏪',
    format: 'number' as const,
  },
  {
    key: 'activeAffiliates',
    label: 'المسوّقون النشطون',
    icon: '🤝',
    format: 'number' as const,
  },
  {
    key: 'totalGMV',
    label: 'إجمالي المبيعات',
    icon: '💰',
    format: 'dzd' as const,
  },
  {
    key: 'platformRevenue',
    label: 'عمولة المنصة',
    icon: '📈',
    format: 'dzd' as const,
  },
  {
    key: 'totalConversions',
    label: 'إجمالي التحويلات',
    icon: '📦',
    format: 'number' as const,
  },
  {
    key: 'pendingCommissions',
    label: 'عمولات معلّقة',
    icon: '⏳',
    format: 'dzd' as const,
  },
] as const

function DashboardPage() {
  const { stats, monthlyRevenue, topAffiliates, wilayaStats, recentActivity } =
    useLoaderData({ from: '/_dashboard/dashboard/' })

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-xs text-gray-400">نظرة شاملة على أداء المنصة</p>
      </div>

      {/* KPI Cards — 3 عمود على desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {statCards.map((card) => (
          <StatsCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            metric={stats[card.key]}
            format={card.format}
          />
        ))}
      </div>

      {/* Overview Chart + Top Affiliates */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewChart data={monthlyRevenue} />
        </div>
        <div>
          <TopAffiliates affiliates={topAffiliates} />
        </div>
      </div>

      {/* Wilaya Chart + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WilayaChart data={wilayaStats} />
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  )
}
