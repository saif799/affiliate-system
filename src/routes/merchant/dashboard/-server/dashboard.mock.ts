// merchant/dashboard/-server/dashboard.mock.ts

import type { MerchantDashboardData } from '../dashboard.types'

export const mockMerchantDashboard: MerchantDashboardData = {
  stats: {
    netRevenue: 284500,
    pendingPackaging: 12,
    deliveryRate: 74,
    returnRate: 22,
  },

  chartData: [
    { date: '01/07', delivered: 8,  returned: 3 },
    { date: '02/07', delivered: 12, returned: 2 },
    { date: '03/07', delivered: 7,  returned: 4 },
    { date: '04/07', delivered: 15, returned: 1 },
    { date: '05/07', delivered: 18, returned: 5 },
    { date: '06/07', delivered: 11, returned: 3 },
    { date: '07/07', delivered: 20, returned: 6 },
  ],

  recentOrders: [
    { id: 'ORD-001', wilaya: 'الجزائر',   productName: 'حذاء رياضي أبيض', status: 'pending',   createdAt: '2025-07-07' },
    { id: 'ORD-002', wilaya: 'وهران',     productName: 'سترة شتوية',       status: 'shipped',   createdAt: '2025-07-07' },
    { id: 'ORD-003', wilaya: 'قسنطينة',  productName: 'حذاء رياضي أبيض', status: 'delivered', createdAt: '2025-07-06' },
    { id: 'ORD-004', wilaya: 'سطيف',     productName: 'حقيبة جلدية',      status: 'returned',  createdAt: '2025-07-06' },
    { id: 'ORD-005', wilaya: 'عنابة',    productName: 'سترة شتوية',       status: 'pending',   createdAt: '2025-07-05' },
  ],

  lowStockProducts: [
    { id: 'PRD-001', name: 'حذاء رياضي أبيض (مقاس 42)', stockQuantity: 3,  threshold: 10 },
    { id: 'PRD-002', name: 'سترة شتوية (L)',              stockQuantity: 5,  threshold: 10 },
    { id: 'PRD-003', name: 'حقيبة جلدية بنية',            stockQuantity: 1,  threshold: 5  },
  ],


  topProducts: [
  { id: 'PRD-010', name: 'حذاء رياضي أبيض',  totalSold: 87, revenue: 521000 },
  { id: 'PRD-011', name: 'سترة شتوية (L)',    totalSold: 54, revenue: 324000 },
  { id: 'PRD-012', name: 'حقيبة جلدية بنية', totalSold: 31, revenue: 248000 },
],
}

