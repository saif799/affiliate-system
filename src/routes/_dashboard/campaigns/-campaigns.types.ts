// ─── Status ───────────────────────────────────────────

export type CampaignStatus = 'active' | 'pending' | 'suspended' | 'banned'

// ─── KPI Cards ────────────────────────────────────────

export interface CampaignMetric {
  value: number
  change: number // نسبة مئوية مقارنة بالشهر الماضي
}

export interface CampaignStats {
  totalCampaigns: CampaignMetric
  activeCampaigns: CampaignMetric
  pendingApproval: CampaignMetric
  suspendedCampaigns: CampaignMetric
}

// ─── Campaign Row ─────────────────────────────────────

export interface Campaign {
  id: string
  productName: string
  merchantName: string
  merchantWilaya: string
  commissionRate: number // نسبة مئوية مثل 8
  status: CampaignStatus
  conversions: number
  totalSales: number // DZD
  returnRate: number // نسبة مئوية مثل 12
  affiliatesCount: number
  createdAt: string
  suspendedAt?: string
  suspendedBy?: string
  suspendReason?: string
}

// ─── Conversions Over Time ────────────────────────────

export interface MonthlyConversions {
  month: string // "Jan" | "Feb" ...
  conversions: number
  revenue: number // DZD
}

// ─── Top Campaigns ────────────────────────────────────

export interface TopCampaign {
  id: string
  productName: string
  merchantName: string
  conversions: number
  revenue: number // DZD
  commissionRate: number
}

// ─── Category Distribution ───────────────────────────

export interface CategoryStat {
  category: string
  campaigns: number
  conversions: number
}

// ─── Root ─────────────────────────────────────────────

export interface CampaignsData {
  stats: CampaignStats
  campaigns: Campaign[]
  monthlyConversions: MonthlyConversions[]
  topCampaigns: TopCampaign[]
  categoryStats: CategoryStat[]
}
