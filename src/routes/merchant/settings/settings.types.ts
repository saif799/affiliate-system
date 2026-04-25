export type WilayaType =
  | 'الجزائر العاصمة'
  | 'وهران'
  | 'قسنطينة'
  | 'عنابة'
  | 'سطيف'
  | 'باتنة'
  | 'بجاية'
  | 'تيزي وزو'
  | 'بلعباس'
  | 'تلمسان'

export type VerificationStatus = 'verified' | 'pending' | 'unverified'

export type PayoutMethod = 'ccp' | 'cib' | 'paysera'

export type WithdrawalFrequency = 'manual' | 'weekly' | 'monthly'

export type SessionDevice = 'desktop' | 'mobile' | 'tablet'

// ─── Profile ────────────────────────────────────────────────────────────────

export interface MerchantProfile {
  fullName: string
  email: string
  phone: string
  storeName: string
}

export interface PickupDetails {
  wilaya: WilayaType | string
  commune: string
  address: string
}

export interface LegalInfo {
  rc: string
  rcStatus: VerificationStatus
  nif: string
  nifStatus: VerificationStatus
}

export interface ProfileData {
  profile: MerchantProfile
  pickup: PickupDetails
  legal: LegalInfo
}

// ─── Payout ─────────────────────────────────────────────────────────────────

export interface PayoutAccount {
  id: string
  type: PayoutMethod
  label: string
  detail: string
  isDefault: boolean
}

export interface WithdrawalSettings {
  threshold: number
  frequency: WithdrawalFrequency
}

export interface PayoutData {
  accounts: PayoutAccount[]
  withdrawalSettings: WithdrawalSettings
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationToggles {
  lowStock: boolean
  newOrders: boolean
  paymentConfirmation: boolean
  weeklyReport: boolean
  returnRateAlert: boolean
  affiliateActivity: boolean
}

export interface NotificationChannels {
  email: string
  whatsapp: string
}

export interface NotificationsData {
  toggles: NotificationToggles
  channels: NotificationChannels
}

// ─── Security ────────────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string
  browser: string
  location: string
  device: SessionDevice
  lastActive: string
  ip: string
  isCurrent: boolean
}

export interface SecurityData {
  sessions: ActiveSession[]
}

// ─── Full Settings Page ──────────────────────────────────────────────────────

export interface SettingsData {
  profile: ProfileData
  payout: PayoutData
  notifications: NotificationsData
  security: SecurityData
}

export type SettingsTab = 'profile' | 'payout' | 'notifications' | 'security'