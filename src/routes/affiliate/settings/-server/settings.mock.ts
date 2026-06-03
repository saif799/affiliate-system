// ============================================================
// -server/settings.mock.ts
// ============================================================

import type { SettingsData } from '../-settings.types'

export const mockSettingsData: SettingsData = {
  profile: {
    id: 'aff-001',
    fullName: 'عبد الوكيل بن عمر',
    username: 'abdwakil.dz',
    email: 'abdwakil@gmail.com',
    phone: '0555 123 456',
    avatarUrl: undefined,
    socialLinks: {
      tiktok: 'https://tiktok.com/@abdwakil',
      facebook: 'https://facebook.com/abdwakil.dz',
      instagram: '',
    },
    joinedAt: '2025-09-01T10:00:00Z',
  },

  payoutMethods: [
    {
      id: 'pm-001',
      label: 'CCP الشخصي',
      account: {
        type: 'ccp',
        accountNumber: '0799 123 456',
        key: '47',
      },
      isDefault: true,
      createdAt: '2025-09-05T12:00:00Z',
    },
    {
      id: 'pm-002',
      label: 'BaridiMob الرئيسي',
      account: {
        type: 'baridimob',
        rip: '00799999000107991234560047',
      },
      isDefault: false,
      createdAt: '2025-10-10T09:30:00Z',
    },
  ],

  notifications: {
    doNotDisturb: false,
    preferences: [
      {
        id: 'notif-01',
        label: 'عمولة جديدة',
        description: 'عند تسجيل عمولة من طلبية مؤكدة',
        channels: { email: true, platform: true },
      },
      {
        id: 'notif-02',
        label: 'تحديث حالة الطلبية',
        description: 'عند تغير حالة الطلبية (مشحونة → مُسلّمة)',
        channels: { email: false, platform: true },
      },
      {
        id: 'notif-03',
        label: 'تحويل الأموال',
        description: 'عند إتمام تحويل الأموال إلى حسابك',
        channels: { email: true, platform: true },
      },
      {
        id: 'notif-04',
        label: 'منتجات جديدة',
        description: 'عند إضافة منتجات جديدة في السوق',
        channels: { email: false, platform: false },
      },
      {
        id: 'notif-05',
        label: 'طلب سحب مرفوض',
        description: 'عند رفض طلب سحب الأموال مع ذكر السبب',
        channels: { email: true, platform: true },
      },
    ],
  },

  security: {
    twoFactorEnabled: false,
    referralCode: 'AWB-7X92',
    sessions: [
      {
        id: 'sess-001',
        device: 'Chrome — هاتف أندرويد',
        location: 'وهران، الجزائر',
        ip: '105.101.xx.xx',
        lastActive: new Date().toISOString(),
        isCurrent: true,
      },
      {
        id: 'sess-002',
        device: 'Firefox — حاسوب',
        location: 'سطيف، الجزائر',
        ip: '105.98.xx.xx',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isCurrent: false,
      },
      {
        id: 'sess-003',
        device: 'Safari — iPhone',
        location: 'الجزائر العاصمة',
        ip: '41.200.xx.xx',
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isCurrent: false,
      },
    ],
  },
}