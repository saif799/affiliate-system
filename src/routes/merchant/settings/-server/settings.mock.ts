import type { SettingsData } from '../settings.types'

export const mockSettingsData: SettingsData = {
  profile: {
    profile: {
      fullName: 'عبد الوكيل بوعلام',
      email: 'abdelouakil@gmail.com',
      phone: '0555 123 456',
      storeName: 'متجر الأطلس',
    },
    pickup: {
      wilaya: 'وهران',
      commune: 'سيدي المرسي',
      address: 'حي النصر، عمارة 3، شقة 12، بالقرب من المسجد الكبير',
    },
    legal: {
      rc: '16-AB-123456',
      rcStatus: 'pending',
      nif: '000216123456789',
      nifStatus: 'verified',
    },
  },

  payout: {
    accounts: [
      {
        id: 'acc-1',
        type: 'ccp',
        label: 'حساب CCP',
        detail: '2001 4567 89 — بريد وهران',
        isDefault: true,
      },
      {
        id: 'acc-2',
        type: 'cib',
        label: 'تحويل بنكي — CIB',
        detail: 'RIB: 007 00600 1234567890 89',
        isDefault: false,
      },
    ],
    withdrawalSettings: {
      threshold: 50000,
      frequency: 'weekly',
    },
  },

  notifications: {
    toggles: {
      lowStock: true,
      newOrders: true,
      paymentConfirmation: true,
      weeklyReport: false,
      returnRateAlert: true,
      affiliateActivity: false,
    },
    channels: {
      email: 'abdelouakil@gmail.com',
      whatsapp: '',
    },
  },

  security: {
    sessions: [
      {
        id: 'ses-1',
        browser: 'Chrome',
        location: 'وهران',
        device: 'desktop',
        lastActive: 'الآن',
        ip: '105.99.xxx.xxx',
        isCurrent: true,
      },
      {
        id: 'ses-2',
        browser: 'Safari',
        location: 'iPhone 14',
        device: 'mobile',
        lastActive: 'منذ 3 ساعات',
        ip: '105.99.xxx.xxx',
        isCurrent: false,
      },
      {
        id: 'ses-3',
        browser: 'Firefox',
        location: 'الجزائر العاصمة',
        device: 'desktop',
        lastActive: 'أمس',
        ip: '41.111.xxx.xxx',
        isCurrent: false,
      },
    ],
  },
}