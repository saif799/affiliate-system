// src/routes/merchant/affiliates/-components/AffiliateKPIs.tsx

import type { AffiliateStats } from '../-affiliates.types'

function formatDZD(amount: number): string {
  return `${amount.toLocaleString('en-US')} DZD`
}

interface Props {
  stats: AffiliateStats
}

export function AffiliateKPIs({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">مسوقون نشطون</p>
        <p className="mt-1.5 text-xl font-bold text-gray-900">{stats.activeAffiliates}</p>
        <p className="mt-0.5 text-xs text-gray-400">يروجون لمنتجاتك الآن</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">طلبيات هذا الشهر</p>
        <p className="mt-1.5 text-xl font-bold text-gray-900">{stats.ordersThisMonth}</p>
        <p className="mt-0.5 text-xs text-gray-400">عبر المسوقين</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">إجمالي العمولات</p>
        <p className="mt-1.5 text-xl font-bold text-gray-900 break-words">{formatDZD(stats.totalCommissions)}</p>
        <p className="mt-0.5 text-xs text-gray-400">ما ربحه المسوقون منك</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">معدل التحويل</p>
        <p className="mt-1.5 text-xl font-bold text-green-600">{stats.conversionRate}%</p>
        <p className="mt-0.5 text-xs text-gray-400">زوار → طلبيات</p>
      </div>
    </div>
  )
}