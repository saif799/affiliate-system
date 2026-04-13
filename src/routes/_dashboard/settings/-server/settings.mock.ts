import type { SettingsData } from '../settings.types'

export const settingsMock: SettingsData = {
  financial: {
    defaultTakeRate: 10,
    minimumPayout: 5000,
    payoutSchedule: 'monthly',
    categoryCommissions: [
      { category: 'مجوهرات', rate: 8 },
      { category: 'ملابس', rate: 6 },
      { category: 'إلكترونيات', rate: 10 },
      { category: 'تجميل', rate: 7 },
      { category: 'رياضة', rate: 6 },
    ],
  },
  general: {
    platformName: 'Tanstack-wakil',
    supportEmail: 'support@wakil.dz',
    termsUrl: 'https://wakil.dz/terms',
    privacyUrl: 'https://wakil.dz/privacy',
    maintenanceMode: false,
  },
  team: [
    {
      id: 'tm-001',
      name: 'Abdelouakil',
      email: 'admin@wakil.dz',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-01',
    },
    {
      id: 'tm-002',
      name: 'basset',
      email: 'basset@wakil.dz',
      role: 'finance',
      status: 'active',
      joinedAt: '2024-03-15',
    },
    {
      id: 'tm-003',
      name: 'saif Zouaoui',
      email: 'karim@wakil.dz',
      role: 'support',
      status: 'invited',
      joinedAt: '2024-11-20',
    },
       {
      id: 'tm-003',
      name: 'abdo',
      email: 'abdo@wakil.dz',
      role: 'support',
      status: 'invited',
      joinedAt: '2024-11-20',
    }
  ],
  security: {
    twoFactorEnabled: false,
    activeSessions: 2,
  },
}