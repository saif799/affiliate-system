export type PayoutSchedule = 'weekly' | 'biweekly' | 'monthly'

export type TeamRole = 'admin' | 'finance' | 'support'

export type TeamMemberStatus = 'active' | 'invited' | 'suspended'

export interface CategoryCommission {
  category: string
  rate: number
}

export interface FinancialSettings {
  defaultTakeRate: number
  minimumPayout: number
  payoutSchedule: PayoutSchedule
  categoryCommissions: CategoryCommission[]
}

export interface GeneralSettings {
  platformName: string
  supportEmail: string
  termsUrl: string
  privacyUrl: string
  maintenanceMode: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  status: TeamMemberStatus
  joinedAt: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  activeSessions: number
}

export interface SettingsData {
  financial: FinancialSettings
  general: GeneralSettings
  team: TeamMember[]
  security: SecuritySettings
}