// src/routes/_dashboard/affiliates/-affiliates.types.ts

export type AffiliateStatus = 'active' | 'suspended' | 'pending'

export interface AffiliateWarning {
  id: string
  message: string
  sentAt: string
}

export interface Affiliate {
  id: string
  name: string
  email: string
  phone: string
  wilaya: string
  status: AffiliateStatus
  joinedAt: string
  totalCampaigns: number
  totalOrders: number
  totalCommissions: number
  pendingCommissions: number
  warnings: AffiliateWarning[]
}