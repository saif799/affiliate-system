import type { DashboardData } from '../dashboard.types'

export const mockDashboardData: DashboardData = {

  stats: {
    totalMerchants: {
      value: 142, growth: 12,
      sparkline: [80, 95, 105, 118, 130, 142],
    },
    activeAffiliates: {
      value: 318, growth: 24,
      sparkline: [180, 210, 245, 270, 295, 318],
    },
    totalGMV: {
      value: 18450000, growth: 31,
      sparkline: [8000000, 10500000, 12000000, 14200000, 16100000, 18450000],
    },
    platformRevenue: {
      value: 1660500, growth: 31,
      sparkline: [720000, 945000, 1080000, 1278000, 1449000, 1660500],
    },
    totalConversions: {
      value: 4821, growth: 18,
      sparkline: [2100, 2700, 3100, 3600, 4200, 4821],
    },
    pendingCommissions: {
      value: 342000, growth: -8,
      sparkline: [520000, 480000, 430000, 410000, 370000, 342000],
    },
  },

  monthlyRevenue: [
    { month: 'Jan', gmv: 8000000,  platformRevenue: 720000  },
    { month: 'Feb', gmv: 9200000,  platformRevenue: 828000  },
    { month: 'Mar', gmv: 10500000, platformRevenue: 945000  },
    { month: 'Apr', gmv: 11800000, platformRevenue: 1062000 },
    { month: 'May', gmv: 13400000, platformRevenue: 1206000 },
    { month: 'Jun', gmv: 15200000, platformRevenue: 1368000 },
    { month: 'Jul', gmv: 16100000, platformRevenue: 1449000 },
    { month: 'Aug', gmv: 14800000, platformRevenue: 1332000 },
    { month: 'Sep', gmv: 15900000, platformRevenue: 1431000 },
    { month: 'Oct', gmv: 17200000, platformRevenue: 1548000 },
    { month: 'Nov', gmv: 17900000, platformRevenue: 1611000 },
    { month: 'Dec', gmv: 18450000, platformRevenue: 1660500 },
  ],

  topAffiliates: [
    { id: 'aff_01', name: 'abdelouakil',    wilaya: 'Alger',    conversions: 312, revenue: 1872000 },
    { id: 'aff_02', name: 'Meriem Hadj',      wilaya: 'Oran',     conversions: 278, revenue: 1668000 },
    { id: 'aff_03', name: 'Karim Zouaoui',    wilaya: 'Constantine', conversions: 241, revenue: 1446000 },
    { id: 'aff_04', name: 'Nassima Khelif',   wilaya: 'Sétif',    conversions: 198, revenue: 1188000 },
    { id: 'aff_05', name: 'Hamid Boukhalfa',  wilaya: 'Annaba',   conversions: 176, revenue: 1056000 },
  ],

  wilayaStats: [
    { wilaya: 'Alger',       conversions: 1240, revenue: 7440000 },
    { wilaya: 'Oran',        conversions: 820,  revenue: 4920000 },
    { wilaya: 'Constantine', conversions: 610,  revenue: 3660000 },
    { wilaya: 'Sétif',       conversions: 480,  revenue: 2880000 },
    { wilaya: 'Annaba',      conversions: 390,  revenue: 2340000 },
    { wilaya: 'Blida',       conversions: 340,  revenue: 2040000 },
    { wilaya: 'Tizi Ouzou',  conversions: 290,  revenue: 1740000 },
    { wilaya: 'Béjaïa',      conversions: 245,  revenue: 1470000 },
    { wilaya: 'Batna',       conversions: 210,  revenue: 1260000 },
    { wilaya: 'Médéa',       conversions: 196,  revenue: 1176000 },
  ],

  recentActivity: [
    { id: 'act_01', type: 'conversion',    actor: 'Youcef Benali',   wilaya: 'Alger',    amount: 12000,  timestamp: 'منذ 3 دقائق'  },
    { id: 'act_02', type: 'new_merchant',  actor: 'TechStore DZ',    wilaya: 'Oran',              timestamp: 'منذ 17 دقيقة' },
    { id: 'act_03', type: 'conversion',    actor: 'Meriem Hadj',     wilaya: 'Oran',     amount: 8500,   timestamp: 'منذ 34 دقيقة' },
    { id: 'act_04', type: 'new_affiliate', actor: 'Sofiane Merad',   wilaya: 'Sétif',             timestamp: 'منذ 1 ساعة'   },
    { id: 'act_05', type: 'commission_paid',actor: 'Karim Zouaoui',  wilaya: 'Constantine',amount: 45000,  timestamp: 'منذ 2 ساعة'   },
    { id: 'act_06', type: 'conversion',    actor: 'Nassima Khelif',  wilaya: 'Sétif',    amount: 15500,  timestamp: 'منذ 3 ساعات'  },
  ],
}
