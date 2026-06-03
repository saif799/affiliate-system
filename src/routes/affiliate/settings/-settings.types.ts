// ============================================================
// settings.types.ts
// ============================================================

export type SettingsTab = 'profile' | 'payout' | 'notifications' | 'security'

// ─── Profile ─────────────────────────────────────────────────
export interface SocialLinks {
  tiktok?: string
  facebook?: string
  instagram?: string
}

export interface AffiliateProfile {
  id: string
  fullName: string
  username: string // = رمز الإحالة (يُستخدم في رابط المسوّق)
  email: string
  phone: string
  avatarUrl?: string
  socialLinks: SocialLinks
  joinedAt: string
}

// ─── Payout Methods (مشتقّة من طلبات السحب السابقة — للعرض) ───
export type PayoutMethodType = 'CCP' | 'BaridiMob'

export interface PayoutMethod {
  id: string
  type: PayoutMethodType
  label: string
  detail: string // رقم الحساب
  isDefault: boolean
}

// ─── Notifications ───────────────────────────────────────────
export type NotificationChannel = 'email' | 'platform'

export interface NotificationPreference {
  id: string
  label: string
  description: string
  channels: {
    email: boolean
    platform: boolean
  }
}

export interface NotificationSettings {
  doNotDisturb: boolean
  preferences: NotificationPreference[]
}

// ─── Security ────────────────────────────────────────────────
export interface ActiveSession {
  id: string
  device: string // "Chrome - هاتف أندرويد"
  location: string // "وهران، الجزائر"
  ip: string
  lastActive: string // ISO
  isCurrent: boolean
}

export interface SecuritySettings {
  sessions: ActiveSession[]
  twoFactorEnabled: boolean
  referralCode: string
}

// ─── Full Settings Data ──────────────────────────────────────
export interface SettingsData {
  profile: AffiliateProfile
  payoutMethods: PayoutMethod[]
  notifications: NotificationSettings
  security: SecuritySettings
}

// ─── Form Types ──────────────────────────────────────────────
export interface UpdateProfileForm {
  fullName: string
  username: string
  phone: string
  socialLinks: SocialLinks
}

export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
