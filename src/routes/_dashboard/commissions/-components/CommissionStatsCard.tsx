// -components/CommissionStatsCard.tsx

import type { CommissionStats, PaymentBreakdown } from '../-commissions.types'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString('ar-DZ')
}

function pct(current: number, previous: number) {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

// ---- KPI Card (نفس نمط AffiliateStatsBar) ----
function KpiCard({
  label,
  value,
  icon,
  iconBg,
  sub,
  subColor,
}: {
  label: string
  value: string
  icon: string
  iconBg: string
  sub: string
  subColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900 mt-0.5">{value} دج</p>
        <p className="text-xs mt-0.5" style={{ color: subColor ?? '#9ca3af' }}>
          {sub}
        </p>
      </div>
    </div>
  )
}

// ---- Bar Row ----
function BarRow({
  label,
  fill,
  value,
  color,
}: {
  label: string
  fill: number
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-xs text-gray-500 w-16 text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.max(fill, 0), 100)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-28 shrink-0 text-left">{value}</span>
    </div>
  )
}

export function CommissionStatsCard({
  stats,
  breakdown,
}: {
  stats: CommissionStats
  breakdown: PaymentBreakdown
}) {
  const change = pct(stats.currentMonthEarnings, stats.previousMonthEarnings)
  const total = breakdown.totalPaid + breakdown.totalPending
  const paidPct = total > 0 ? (breakdown.totalPaid / total) * 100 : 0
  const mTotal = breakdown.merchantPaid + breakdown.merchantPending
  const aTotal = breakdown.affiliatePaid + breakdown.affiliatePending
  const mPaidPct = mTotal > 0 ? (breakdown.merchantPaid / mTotal) * 100 : 0
  const aPaidPct = aTotal > 0 ? (breakdown.affiliatePaid / aTotal) * 100 : 0

  return (
    <div className="space-y-5">
      {/* القسم 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="🏆"
          iconBg="bg-blue-50 text-blue-700"
          label="إجمالي الأرباح منذ الانطلاق"
          value={fmt(stats.totalPlatformEarnings)}
          sub="منذ بداية المنصة"
        />
        <KpiCard
          icon="📈"
          iconBg="bg-green-50 text-green-700"
          label="أرباح هذا الشهر"
          value={fmt(stats.currentMonthEarnings)}
          sub={
            change !== null
              ? `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}% من الشهر الماضي`
              : 'لا توجد بيانات للمقارنة'
          }
          subColor={change === null ? undefined : change >= 0 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard
          icon="🏪"
          iconBg="bg-orange-50 text-orange-700"
          label="مستحقات التجار"
          value={fmt(stats.merchantsPendingBalance)}
          sub="لم تُسوَّى بعد"
          subColor="#d97706"
        />
        <KpiCard
          icon="💸"
          iconBg="bg-purple-50 text-purple-700"
          label="مستحقات المسوّقين"
          value={fmt(stats.affiliatesPendingBalance)}
          sub="في انتظار الموافقة"
          subColor="#d97706"
        />
      </div>

      {/* القسم 2 — Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* المدفوع مقابل المعلق */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-baseline mb-4">
            <p className="text-sm font-semibold text-gray-800">ما تم دفعه مقابل ما تبقى</p>
            <p className="text-xs text-gray-400">إجمالي الطرفين</p>
          </div>
          <BarRow
            label="مدفوع"
            fill={paidPct}
            value={`${fmt(breakdown.totalPaid)} دج`}
            color="#1D9E75"
          />
          <BarRow
            label="معلق"
            fill={100 - paidPct}
            value={`${fmt(breakdown.totalPending)} دج`}
            color="#EF9F27"
          />
          <hr className="my-3 border-gray-100" />
          <BarRow
            label="التجار"
            fill={mPaidPct}
            value={`${fmt(breakdown.merchantPaid)} / ${fmt(breakdown.merchantPending)}`}
            color="#60a5fa"
          />
          <BarRow
            label="المسوّقون"
            fill={aPaidPct}
            value={`${fmt(breakdown.affiliatePaid)} / ${fmt(breakdown.affiliatePending)}`}
            color="#a78bfa"
          />
        </div>

        {/* توزيع الوسائل */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-baseline mb-4">
            <p className="text-sm font-semibold text-gray-800">المعلق حسب وسيلة الدفع</p>
            <p className="text-xs text-gray-400">لتحديد أولويات الصرف</p>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex justify-between items-center py-3.5">
              <p className="text-base font-semibold text-gray-800">
                {fmt(breakdown.pendingByBaridiMob)} دج
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {breakdown.pendingBaridiMobCount} طلب
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                  BaridiMob
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <p className="text-base font-semibold text-gray-800">
                {fmt(breakdown.pendingByCCP)} دج
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{breakdown.pendingCCPCount} طلب</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  CCP
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 border-r-2 border-gray-200 pr-2.5 mt-3 leading-relaxed">
            BaridiMob لحظي — ادفعه أولاً لتقليل وقت الانتظار
          </p>
        </div>
      </div>
    </div>
  )
}