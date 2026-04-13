import type { AnalyticsData } from '../analytics.types'

export const mockAnalyticsData: AnalyticsData = {

  kpis: {
    totalGMV:           { value: 18450000, change: 31  },
    platformRevenue:    { value: 2180000,  change: 18  },
    takeRate:           { value: 11.8,     change: 2   },
    affiliateRetention: { value: 74,       change: -3  },
  },

  monthlyProfitability: [
    { month: 'Jan', gmv: 8000000,  platformRevenue: 720000,  affiliatePayout: 210000 },
    { month: 'Feb', gmv: 9200000,  platformRevenue: 828000,  affiliatePayout: 245000 },
    { month: 'Mar', gmv: 10500000, platformRevenue: 945000,  affiliatePayout: 290000 },
    { month: 'Apr', gmv: 11800000, platformRevenue: 1062000, affiliatePayout: 320000 },
    { month: 'May', gmv: 13400000, platformRevenue: 1206000, affiliatePayout: 380000 },
    { month: 'Jun', gmv: 15200000, platformRevenue: 1368000, affiliatePayout: 410000 },
    { month: 'Jul', gmv: 16100000, platformRevenue: 1449000, affiliatePayout: 390000 },
    { month: 'Aug', gmv: 14800000, platformRevenue: 1332000, affiliatePayout: 430000 },
    { month: 'Sep', gmv: 15900000, platformRevenue: 1431000, affiliatePayout: 480000 },
    { month: 'Oct', gmv: 17200000, platformRevenue: 1548000, affiliatePayout: 520000 },
    { month: 'Nov', gmv: 17900000, platformRevenue: 1611000, affiliatePayout: 560000 },
    { month: 'Dec', gmv: 18450000, platformRevenue: 1660500, affiliatePayout: 490000 },
  ],

  affiliateRisks: [
    { id: 'ar_01', name: 'Sofiane Merad',   wilaya: 'Sétif',       totalOrders: 88,  cancelledOrders: 61, cancellationRate: 69, riskLevel: 'high'   },
    { id: 'ar_02', name: 'Walid Boudiaf',   wilaya: 'Blida',       totalOrders: 120, cancelledOrders: 72, cancellationRate: 60, riskLevel: 'high'   },
    { id: 'ar_03', name: 'Imane Kerrar',    wilaya: 'Batna',       totalOrders: 54,  cancelledOrders: 29, cancellationRate: 54, riskLevel: 'high'   },
    { id: 'ar_04', name: 'Rachid Aoudia',   wilaya: 'Tizi Ouzou',  totalOrders: 200, cancelledOrders: 86, cancellationRate: 43, riskLevel: 'medium' },
    { id: 'ar_05', name: 'Samia Boudaoud',  wilaya: 'Annaba',      totalOrders: 67,  cancelledOrders: 27, cancellationRate: 40, riskLevel: 'medium' },
  ],

  merchantRisks: [
    { id: 'mr_01', name: 'HealthStore',     wilaya: 'Constantine', receivedOrders: 140, rejectedOrders: 84, rejectionRate: 60, riskLevel: 'high'   },
    { id: 'mr_02', name: 'ElectroStore',    wilaya: 'Batna',       receivedOrders: 95,  rejectedOrders: 47, rejectionRate: 49, riskLevel: 'high'   },
    { id: 'mr_03', name: 'Fresh Algeria',   wilaya: 'Alger',       receivedOrders: 78,  rejectedOrders: 33, rejectionRate: 42, riskLevel: 'high'   },
    { id: 'mr_04', name: 'Leather Craft',   wilaya: 'Tlemcen',     receivedOrders: 110, rejectedOrders: 41, rejectionRate: 37, riskLevel: 'medium' },
    { id: 'mr_05', name: 'KidsWorld',       wilaya: 'Oran',        receivedOrders: 88,  rejectedOrders: 30, rejectionRate: 34, riskLevel: 'medium' },
  ],

  affiliateConcentration: [
    { name: 'Youcef Benali',   revenue: 1872000, percentage: 22.1, cumulative: 22.1 },
    { name: 'Meriem Hadj',     revenue: 1668000, percentage: 19.7, cumulative: 41.8 },
    { name: 'Karim Zouaoui',   revenue: 1446000, percentage: 17.1, cumulative: 58.9 },
    { name: 'Nassima Khelif',  revenue: 1188000, percentage: 14.0, cumulative: 72.9 },
    { name: 'Hamid Boukhalfa', revenue: 1056000, percentage: 12.5, cumulative: 85.4 },
    { name: 'باقي المسوقين',   revenue: 1230000, percentage: 14.6, cumulative: 100  },
  ],

  merchantConcentration: [
    { name: 'Beauty Algeria', revenue: 3100000, percentage: 26.8, cumulative: 26.8 },
    { name: 'Bijoux DZ',      revenue: 2800000, percentage: 24.2, cumulative: 51.0 },
    { name: 'TechShop DZ',    revenue: 1950000, percentage: 16.9, cumulative: 67.9 },
    { name: 'SportWear DZ',   revenue: 1200000, percentage: 10.4, cumulative: 78.3 },
    { name: 'KidsWorld',      revenue: 870000,  percentage: 7.5,  cumulative: 85.8 },
    { name: 'باقي التجار',    revenue: 1630000, percentage: 14.2, cumulative: 100  },
  ],

  conversionFunnel: [
    { label: 'نقر الرابط',     count: 48200, rate: 100  },
    { label: 'عرض المنتج',     count: 31300, rate: 64.9 },
    { label: 'طلب مُنشأ',      count: 8640,  rate: 27.6 },
    { label: 'طلب مؤكد',       count: 5960,  rate: 69.0 },
    { label: 'تم التوصيل',     count: 4821,  rate: 80.9 },
    { label: 'عمولة مدفوعة',   count: 4380,  rate: 90.9 },
  ],

  wilayaReturnRates: [
    { wilaya: 'Alger',       orders: 1240, returns: 149, returnRate: 12, riskLevel: 'low'    },
    { wilaya: 'Oran',        orders: 820,  returns: 115, returnRate: 14, riskLevel: 'low'    },
    { wilaya: 'Constantine', orders: 610,  returns: 110, returnRate: 18, riskLevel: 'low'    },
    { wilaya: 'Sétif',       orders: 480,  returns: 115, returnRate: 24, riskLevel: 'medium' },
    { wilaya: 'Annaba',      orders: 390,  returns: 101, returnRate: 26, riskLevel: 'medium' },
    { wilaya: 'Blida',       orders: 340,  returns: 102, returnRate: 30, riskLevel: 'medium' },
    { wilaya: 'Tizi Ouzou',  orders: 290,  returns: 101, returnRate: 35, riskLevel: 'high'   },
    { wilaya: 'Béjaïa',      orders: 245,  returns: 93,  returnRate: 38, riskLevel: 'high'   },
    { wilaya: 'Batna',       orders: 210,  returns: 84,  returnRate: 40, riskLevel: 'high'   },
    { wilaya: 'Médéa',       orders: 196,  returns: 90,  returnRate: 46, riskLevel: 'high'   },
  ],

  monthlyRetention: [
    { month: 'Jan', activeAffiliates: 180, retained: 126, retentionRate: 70 },
    { month: 'Feb', activeAffiliates: 198, retained: 142, retentionRate: 72 },
    { month: 'Mar', activeAffiliates: 215, retained: 158, retentionRate: 73 },
    { month: 'Apr', activeAffiliates: 234, retained: 175, retentionRate: 75 },
    { month: 'May', activeAffiliates: 258, retained: 196, retentionRate: 76 },
    { month: 'Jun', activeAffiliates: 272, retained: 204, retentionRate: 75 },
    { month: 'Jul', activeAffiliates: 265, retained: 196, retentionRate: 74 },
    { month: 'Aug', activeAffiliates: 280, retained: 207, retentionRate: 74 },
    { month: 'Sep', activeAffiliates: 295, retained: 221, retentionRate: 75 },
    { month: 'Oct', activeAffiliates: 308, retained: 232, retentionRate: 75 },
    { month: 'Nov', activeAffiliates: 315, retained: 233, retentionRate: 74 },
    { month: 'Dec', activeAffiliates: 318, retained: 235, retentionRate: 74 },
  ],
}