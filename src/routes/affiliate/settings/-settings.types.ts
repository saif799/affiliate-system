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
  username: string        // يُستخدم في رابط الـ affiliate link
  email: string
  phone: string
  avatarUrl?: string
  socialLinks: SocialLinks
  joinedAt: string
}

// ─── Payout Methods ──────────────────────────────────────────
export type PayoutMethodType = 'ccp' | 'baridimob' | 'bank'

export interface CCPAccount {
  type: 'ccp'
  accountNumber: string
  key: string             // المفتاح (Clé)
}

export interface BaridiMobAccount {
  type: 'baridimob'
  rip: string             // 20 رقماً
}

export interface BankAccount {
  type: 'bank'
  bankName: string
  accountNumber: string
  rib: string
}

export type PayoutAccount = CCPAccount | BaridiMobAccount | BankAccount

export interface PayoutMethod {
  id: string
  label: string           // اسم مخصص: "CCP الشخصي"
  account: PayoutAccount
  isDefault: boolean
  createdAt: string
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
  device: string          // "Chrome - هاتف أندرويد"
  location: string        // "وهران، الجزائر"
  ip: string
  lastActive: string      // ISO
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

export interface AddPayoutMethodForm {
  label: string
  type: PayoutMethodType
  // CCP
  ccpAccount?: string
  ccpKey?: string
  // BaridiMob
  rip?: string
  // Bank
  bankName?: string
  bankAccount?: string
  rib?: string
}

export interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}