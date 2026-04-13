import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getCampaignsData } from './-server/campaigns.api'
import { CampaignStatsCard } from './-components/CampaignStatsCard'
import { ConversionsChart }   from './-components/ConversionsChart'
import { TopCampaigns }       from './-components/TopCampaigns'
import { CategoryChart }      from './-components/CategoryChart'
import { CampaignsTable }     from './-components/CampaignsTable'
import type { CampaignMetric } from './campaigns.types'

export const Route = createFileRoute('/_dashboard/campaigns/')({
  loader: () => getCampaignsData(),

  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
    </div>
  ),
  component: CampaignsPage,
})

// ─── stat cards config ────────────────────────────────

const statCards: {
  key:    keyof ReturnType<typeof useStats>
  label:  string
  icon:   string
}[] = [
  { key: 'totalCampaigns',     label: 'إجمالي الحملات',     icon: '📢' },
  { key: 'activeCampaigns',    label: 'الحملات النشطة',     icon: '✅' },
  { key: 'pendingApproval',    label: 'قيد المراجعة',       icon: '⏳' },
  { key: 'suspendedCampaigns', label: 'موقوفة / محظورة',   icon: '🚫' },
]

// helper — نجعل TypeScript سعيداً
function useStats() {
  const { stats } = useLoaderData({ from: '/_dashboard/campaigns/' })
  return stats
}

// ─── page ─────────────────────────────────────────────

function CampaignsPage() {
  const { stats, campaigns, monthlyConversions, topCampaigns, categoryStats } =
    useLoaderData({ from: '/_dashboard/campaigns/' })

  return (
    <div className="flex flex-col gap-4 p-5" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">الحملات</h1>
        <p className="text-xs text-gray-400">مراقبة واعتماد جميع حملات المنصة</p>
      </div>

      {/* KPI Cards — 4 أعمدة */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <CampaignStatsCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            metric={stats[card.key] as CampaignMetric}
          />
        ))}
      </div>

      {/* Conversions Chart + Top Campaigns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ConversionsChart data={monthlyConversions} />
        </div>
        <div>
          <TopCampaigns campaigns={topCampaigns} />
        </div>
      </div>

      {/* Category Chart */}
      <CategoryChart data={categoryStats} />

      {/* Campaigns Table */}
      <CampaignsTable campaigns={campaigns} />

    </div>
  )
}