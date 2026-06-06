export type PayoutSchedule = 'weekly' | 'biweekly' | 'monthly'
export type PayoutMethod = 'CCP' | 'BaridiMob'
export type TeamRole = 'super_admin' | 'merchant' | 'affiliate' | 'system'
export type TeamMemberStatus = 'active' | 'pending' | 'suspended'

export interface FinancialSettings {
  platform_fee_merchant: number
  platform_fee_affiliate: number
  minimum_payout: number
  clearance_days: number   // مدّة حجز الأرباح (pending→available) بالأيام
  payout_schedule: PayoutSchedule
  payout_methods: PayoutMethod[]
}

export interface GeneralSettings {
  platform_name: string
  support_email: string
  terms_url: string
  privacy_url: string
  maintenance_mode: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  status: TeamMemberStatus
  joined_at: string   // ISO string
  wilaya: string | null
}

export interface SecuritySettings {
  two_factor_enabled: boolean   // placeholder — needs 2FA lib
  active_sessions_count: number
}

export interface SettingsData {
  financial: FinancialSettings
  general: GeneralSettings
  team: TeamMember[]
  security: SecuritySettings
}

// ── Mutation inputs ───────────────────────────────────────────

export interface UpdateFinancialInput {
  platform_fee_merchant: number
  platform_fee_affiliate: number
  minimum_payout: number
  clearance_days: number
  payout_schedule: PayoutSchedule
  payout_methods: PayoutMethod[]
}

export interface UpdateGeneralInput {
  platform_name: string
  support_email: string
  terms_url: string
  privacy_url: string
  maintenance_mode: boolean
}