// src/routes/merchant/affiliates/affiliates.types.ts

export type AffiliateTier = 'bronze' | 'silver' | 'gold'
export type AffiliateStatus = 'active' | 'blocked'

export interface AffiliateTopProduct {
  productId: string
  productName: string
  unitsSold: number
  commission: number
}

export interface AffiliateMonthlySale {
  day: number
  orders: number
}

export interface Affiliate {
  id: string
  name: string
  initials: string
  avatarColor: string
  phone: string
  wilaya: string
  joinedAt: string
  tier: AffiliateTier
  totalOrders: number
  deliveredOrders: number
  returnRate: number
  totalSales: number
  totalCommissions: number
  status: AffiliateStatus
  topProducts: AffiliateTopProduct[]
  last30DaysSales: AffiliateMonthlySale[]
}

export interface AffiliateStats {
  activeAffiliates: number
  ordersThisMonth: number
  totalCommissions: number
  conversionRate: number
}

export interface AffiliatesPageData {
  stats: AffiliateStats
  affiliates: Affiliate[]
}

export type SortKey = 'topSales' | 'newest' | 'topCommission' | 'highestReturn'
export type FilterStatus = 'all' | 'active' | 'blocked'