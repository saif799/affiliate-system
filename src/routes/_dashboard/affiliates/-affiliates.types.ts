// src/routes/_dashboard/affiliates/-affiliates.types.ts

export type AffiliateStatus = 'active' | 'suspended' | 'pending'

export interface AffiliateWarning {
  id: string
  message: string
  sentAt: string
}

export interface Affiliate {
  id: string           // affiliateProfiles.id (uuid)
  userId: string       // users.id
  name: string
  email: string
  phone: string
  wilaya: string
  referralCode: string
  refusalRate: number
  fraudFlag: boolean
  status: AffiliateStatus
  joinedAt: string
  totalCampaigns: number
  totalOrders: number
  totalCommissions: number
  pendingCommissions: number
  warnings: AffiliateWarning[]
}

// ── إحصائية واحدة ─────────────────────────────────────────────
export interface StatValue {
  value: number
  newThisMonth: number
  changeVsPrev: number | null
}

export interface AffiliateStats {
  total:     StatValue
  active:    StatValue
  suspended: StatValue
  pending:   StatValue
}

// ── طلبات الانضمام ────────────────────────────────────────────
export interface JoinRequest {
  id: string           // users.id مباشرةً (لأنه pending وقد لا يملك profile بعد)
  name: string
  email: string
  phone: string
  wilaya: string
  businessName: string
  category: string
  requestedAt: string
  status: 'pending'
}

export interface AffiliatesData {
  stats: AffiliateStats
  affiliates: Affiliate[]
  joinRequests: JoinRequest[]
}