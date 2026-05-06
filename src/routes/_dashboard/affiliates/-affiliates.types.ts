export type AffiliateStatus = 'active' | 'suspended' | 'pending'

export interface Affiliate {
  id: string
  name: string
  email: string
  wilaya: string
  status: AffiliateStatus
  conversions: number
  totalSales: number
  commissionRate: number
  joinedAt: string
}

export interface AffiliatesData {
  affiliates: Affiliate[]
  totalAffiliates: number
  activeAffiliates: number
  totalCommissionsPaid: number
}