// src/routes/_dashboard/merchants/-merchants.types.ts

export type MerchantStatus = 'active' | 'suspended' | 'pending'

export interface MerchantProduct {
  id: string
  name: string
  price: number
  stock: number
  category: string
  status: 'active' | 'inactive'
}

export interface MerchantWarning {
  id: string
  message: string
  sentAt: string
}

export interface Merchant {
  id: string
  name: string
  email: string
  phone: string
  wilaya: string
  businessName: string
  status: MerchantStatus
  joinedAt: string
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  commissionRate: number
  products: MerchantProduct[]
  warnings: MerchantWarning[]
}

// ── إحصائية واحدة (مثل total أو active) ──────────────────────
export interface StatValue {
  value: number
  newThisMonth: number
  changeVsPrev: number | null
}

export interface MerchantStats {
  total:     StatValue
  active:    StatValue
  suspended: StatValue
  pending:   StatValue
}

// ── طلبات الانضمام ────────────────────────────────────────────
export interface JoinRequest {
  id: string
  name: string
  email: string
  phone: string
  wilaya: string
  businessName: string
  category: string
  requestedAt: string
  description: string
  registrationNumber: string
  status: 'pending'
}

export interface MerchantsData {
  stats: MerchantStats
  merchants: Merchant[]
  joinRequests: JoinRequest[]
}