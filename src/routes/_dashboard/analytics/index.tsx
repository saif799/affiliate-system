import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getAnalyticsData }      from './-server/analytics.api'
import { AnalyticsStatsCard }    from './-components/AnalyticsStatsCard'
import { ProfitabilityChart }    from './-components/ProfitabilityChart'
import { RiskList }              from './-components/RiskList'
import { ConcentrationChart }    from './-components/ConcentrationChart'
import { ConversionFunnel }      from './-components/ConversionFunnel'
import { RetentionChart }        from './-components/RetentionChart'
import { WilayaReturnTable }     from './-components/WilayaReturnTable'
import type { AnalyticMetric }   from './analytics.types'

export const Route = createFileRoute('/_dashboard/analytics/')({
  loader: () => getAnalyticsData(),

  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
    </div>
  ),
  component: AnalyticsPage,
})

// ─── stat cards config ────────────────────────────────

const statCards: {
  key:    'totalGMV' | 'platformRevenue' | 'takeRate' | 'affiliateRetention'
  label:  string
  icon:   string
  format: 'dzd' | 'percent' | 'number'
}[] = [
  { key: 'totalGMV',           label: 'إجمالي التداول (GMV)', icon: '📊', format: 'dzd'     },
  { key: 'platformRevenue',    label: 'أرباح الوساطة',        icon: '💰', format: 'dzd'     },
  { key: 'takeRate',           label: 'Take Rate الفعلي',     icon: '📐', format: 'percent' },
  { key: 'affiliateRetention', label: 'Retention المسوقين',   icon: '🔄', format: 'percent' },
]

// ─── page ─────────────────────────────────────────────

function AnalyticsPage() {
  const {
    kpis,
    monthlyProfitability,
    affiliateRisks,
    merchantRisks,
    affiliateConcentration,
    merchantConcentration,
    conversionFunnel,
    wilayaReturnRates,
    monthlyRetention,
  } = useLoaderData({ from: '/_dashboard/analytics/' })

  return (
    <div className="flex flex-col gap-4 p-5" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">التحليلات</h1>
        <p className="text-xs text-gray-400">مؤشرات صحة المنصة — جودة، مخاطر، وربحية</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <AnalyticsStatsCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            metric={kpis[card.key] as AnalyticMetric}
            format={card.format}
          />
        ))}
      </div>

      {/* GMV vs Revenue */}
      <ProfitabilityChart data={monthlyProfitability} />

      {/* Funnel + Retention */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConversionFunnel steps={conversionFunnel} />
        <RetentionChart   data={monthlyRetention}  />
      </div>

      {/* Risk List */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">قائمة المخاطر</h2>
        <RiskList affiliates={affiliateRisks} merchants={merchantRisks} />
      </div>

      {/* Concentration Pareto */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">تركز المخاطر</h2>
        <ConcentrationChart
          affiliates={affiliateConcentration}
          merchants={merchantConcentration}
        />
      </div>

      {/* Wilaya Return Rate */}
      <WilayaReturnTable data={wilayaReturnRates} />

    </div>
  )
}