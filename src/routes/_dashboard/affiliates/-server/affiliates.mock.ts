// src/routes/_dashboard/affiliates/-server/affiliates.mock.ts
import type { Affiliate } from '../-affiliates.types'
import type { JoinRequest } from '../../-shared/-shared.types'

export const MOCK_AFFILIATES: Affiliate[] = [
  {
    id: 'a1',
    name: 'كريم بوعلام',
    email: 'karim@affil.dz',
    phone: '0551234567',
    wilaya: 'الجزائر العاصمة',
    status: 'active',
    joinedAt: '2025-11-10',
    totalCampaigns: 8,
    totalOrders: 142,
    totalCommissions: 54000,
    pendingCommissions: 12000,
    warnings: [],
  },
  {
    id: 'a2',
    name: 'سارة منصوري',
    email: 'sara@affil.dz',
    phone: '0662345678',
    wilaya: 'وهران',
    status: 'active',
    joinedAt: '2025-12-01',
    totalCampaigns: 5,
    totalOrders: 98,
    totalCommissions: 31500,
    pendingCommissions: 8000,
    warnings: [
      { id: 'w1', message: 'تأخر في تسليم الطلبات', sentAt: '2026-02-10' },
    ],
  },
  {
    id: 'a3',
    name: 'يوسف بن عمر',
    email: 'youcef@affil.dz',
    phone: '0773456789',
    wilaya: 'قسنطينة',
    status: 'suspended',
    joinedAt: '2026-01-15',
    totalCampaigns: 2,
    totalOrders: 21,
    totalCommissions: 7200,
    pendingCommissions: 0,
    warnings: [
      { id: 'w2', message: 'مخالفة شروط الاستخدام', sentAt: '2026-03-05' },
      { id: 'w3', message: 'شكاوى من العملاء', sentAt: '2026-03-20' },
    ],
  },
  {
    id: 'a4',
    name: 'أمينة بلحاج',
    email: 'amina@affil.dz',
    phone: '0554567890',
    wilaya: 'سطيف',
    status: 'pending',
    joinedAt: '2026-04-01',
    totalCampaigns: 0,
    totalOrders: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    warnings: [],
  },
]

export const MOCK_AFFILIATE_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'ajr1',
    name: 'رضا بن يوسف',
    businessName: 'رضا بن يوسف',
    email: 'reda@affil.dz',
    phone: '0661234567',
    wilaya: 'البليدة',
    category: 'مسوق',
    requestedAt: '2026-05-10',
    extraFields: [
      { label: 'رابط الصفحة', value: 'instagram.com/reda_marketing' },
    ],
  },
  {
    id: 'ajr2',
    name: 'نور الهدى سعدي',
    businessName: 'نور الهدى سعدي',
    email: 'nour@affil.dz',
    phone: '0772345678',
    wilaya: 'تيزي وزو',
    category: 'مسوق',
    requestedAt: '2026-05-12',
    extraFields: [
      { label: 'رابط الصفحة', value: 'facebook.com/nour.saadi' },
    ],
  },
]