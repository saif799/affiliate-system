// merchant/dashboard/index.tsx

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getMerchantDashboard } from './-server/dashboard.api'
import { StatsCard } from './-components/StatsCard'
import { OverviewChart } from './-components/OverviewChart'
import { RecentOrders } from './-components/RecentOrders'
import { LowStockAlerts } from './-components/LowStockAlerts'
import { TopProducts } from './-components/TopProducts'
import type { DateRange } from './dashboard.types'

export const Route = createFileRoute('/merchant/dashboard/')({
  loader: () => getMerchantDashboard(),
  component: MerchantDashboardPage,
})

const dateRangeOptions: { label: string; value: DateRange }[] = [
  { label: 'اليوم', value: 'today' },
  { label: 'آخر 7 أيام', value: '7days' },
  { label: 'هذا الشهر', value: '30days' },
]

function MerchantDashboardPage() {
  const { stats, chartData, recentOrders, lowStockProducts, topProducts } =
    Route.useLoaderData()

  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<DateRange>('7days')

  return (
    <div className="p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-sm text-gray-500">نظرة شاملة على أداء متجرك</p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                dateRange === option.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="الأرباح الصافية"
          value={`${stats.netRevenue.toLocaleString('ar-DZ')} DZD`}
          icon="💰"
          trend={{ value: 12, label: 'vs الشهر الماضي' }}
        />

        {/* ← قابل للنقر — يأخذك لـ orders */}
        <div
          className="cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => navigate({ to: '/merchant/orders' })}
        >
          <StatsCard
            title="طلبيات للتغليف"
            value={String(stats.pendingPackaging)}
            icon="📦"
            urgent={stats.pendingPackaging > 5}
            hint="👉 انقر للانتقال لصفحة التغليف"
          />
        </div>

        <StatsCard
          title="معدل التوصيل"
          value={`${stats.deliveryRate}%`}
          icon="🚚"
          trend={{ value: 3, label: 'vs الشهر الماضي' }}
        />
        <StatsCard
          title="معدل الروتور"
          value={`${stats.returnRate}%`}
          icon="⚠️"
          alert={stats.returnRate > 20}
          trend={{ value: -stats.returnRate, label: 'vs الشهر الماضي' }}
        />
      </div>

      {/* ─── Chart ─── */}
      <OverviewChart data={chartData} />

      {/* ─── Bottom Row ─── */}
      <div className="grid grid-cols-3 gap-4">
        <RecentOrders orders={recentOrders} />
        <LowStockAlerts products={lowStockProducts} />
        <TopProducts products={topProducts} />
      </div>
    </div>
  )
}
