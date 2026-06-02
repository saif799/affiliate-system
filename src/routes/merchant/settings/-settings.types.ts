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

export type PayoutMethod = 'CCP' | 'BaridiMob'

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

export interface ProfileData {
  profile: MerchantProfile
  pickup: PickupDetails
}

// ─── Payout ─────────────────────────────────────────────────────────────────

export interface PayoutAccount {
  id: string
  type: PayoutMethod
  label: string
  detail: string
  isDefault: boolean
}

export interface PayoutData {
  accounts: PayoutAccount[]
  minimumPayout: number
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationToggles {
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
