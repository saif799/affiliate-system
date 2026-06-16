import { createFileRoute, Link } from '@tanstack/react-router'
import { getAffiliateDashboard } from './-server/dashboard.api'
import { StatsCards } from './-components/StatsCards'
import { TopMerchants } from './-components/TopMerchants'
import { RecentActivity } from './-components/RecentActivity'

export const Route = createFileRoute('/affiliate/dashboard/')({
  loader: () => getAffiliateDashboard(),
  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      جاري التحميل...
    </div>
  ),
  component: AffiliateDashboard,
})

function AffiliateDashboard() {
  const data = Route.useLoaderData()

  return (
    <div className="space-y-5 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">لوحة القيادة</h1>
          <p className="text-sm text-gray-500">مرحباً، هذا ملخص نشاطك التسويقي</p>
        </div>
        <Link
          to="/affiliate/marketplace"
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
        >
          + استعراض المنتجات
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={data.stats} />

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TopMerchants merchants={data.topMerchants} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity orders={data.recentOrders} />
        </div>
      </div>
    </div>
  )
}