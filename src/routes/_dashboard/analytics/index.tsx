import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getAnalytics } from './-server/analytics.api'
import type { DateRange, AnalyticsData } from './-analytics.types'
import { KpiCard }         from './-components/KpiCard'
import { GmvChart }        from './-components/GmvChart'
import { TimingCard }      from './-components/TimingCard'
import { AffiliatesTable } from './-components/AffiliatesTable'
import { MerchantsTable }  from './-components/MerchantsTable'
import { WilayaList }      from './-components/WilayaList'

// ─────────────────────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_dashboard/analytics/')({
  loaderDeps: ({ search }: { search: { range?: DateRange } }) => ({
    range: search.range ?? 'this_week',
  }),
  loader: async ({ deps }) =>
    getAnalytics({ data: { range: deps.range } }),
  component: AnalyticsPage,
})

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('fr-DZ')
}

function fmtDzd(n: number) {
  return `${fmt(n)} دج`
}

const RANGE_LABELS: Record<DateRange, string> = {
  this_week:  'هذا الأسبوع',
  this_month: 'هذا الشهر',
  this_year:  'هذا العام',
}

// ─────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-700 text-right border-b border-gray-100 pb-2">
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pending withdrawals alert
// ─────────────────────────────────────────────────────────────

function WithdrawalsAlert({ amount }: { amount: number }) {
  if (amount === 0) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-row-reverse">
      <div className="text-right">
        <p className="text-sm font-semibold text-amber-800">طلبات سحب معلقة</p>
        <p className="text-xs text-amber-600 mt-0.5">تحتاج مراجعة ومعالجة</p>
      </div>
      <p className="text-xl font-bold text-amber-800">{fmtDzd(amount)}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

function AnalyticsPage() {
  const data     = useLoaderData({ from: '/_dashboard/analytics/' }) as AnalyticsData
  const navigate = Route.useNavigate()
  const { range } = Route.useLoaderDeps()

  function setRange(r: DateRange) {
    navigate({ search: { range: r }, replace: true })
  }

  const {
    kpis,
    gmv_series,
    top_affiliates,
    top_merchants,
    wilaya_stats,
    delivery_timing,
  } = data

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto" dir="rtl">

      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          {(['this_week', 'this_month', 'this_year'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-900">التحليلات</h1>
          <p className="text-sm text-gray-500">
            مؤشرات صحة المنصة — {RANGE_LABELS[range]}
          </p>
        </div>
      </div>

      {/* ── Pending withdrawals ── */}
      <WithdrawalsAlert amount={kpis.pending_withdrawals_dzd} />

      {/* ── KPIs ── */}
      <Section title="مؤشرات المنصة">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="إجمالي التداول (GMV)"
            value={fmtDzd(kpis.gmv_dzd)}
            change={kpis.gmv_change_pct}
            accent="blue"
          />
          <KpiCard
            label="Take Rate"
            value={`${kpis.take_rate_pct}%`}
            change={kpis.take_rate_change_pct}
            accent="green"
          />
          <KpiCard
            label="معدل التوصيل"
            value={`${kpis.retention_pct}%`}
            change={kpis.retention_change_pct}
            accent="amber"
          />
          <KpiCard
            label="إجمالي الطلبات"
            value={fmt(kpis.orders_total)}
            change={kpis.orders_change_pct}
            accent="blue"
            sub={`${fmt(kpis.orders_delivered)} تُسلّم · ${fmt(kpis.orders_returned)} رتورن`}
          />
        </div>
      </Section>

      {/* ── GMV chart ── */}
      <Section title="منحنى التداول">
        <GmvChart series={gmv_series} />
      </Section>

      {/* ── Delivery timing ── */}
      <Section title="وقت التوصيل">
        <TimingCard timing={delivery_timing} />
      </Section>

      {/* ── Affiliates ── */}
      <Section title="أداء المسوقين">
        <AffiliatesTable affiliates={top_affiliates} />
      </Section>

      {/* ── Merchants ── */}
      <Section title="أداء التجار">
        <MerchantsTable merchants={top_merchants} />
      </Section>

      {/* ── Wilaya ── */}
      <Section title="الجغرافيا والتوصيل">
        <WilayaList stats={wilaya_stats} />
      </Section>

    </div>
  )
}