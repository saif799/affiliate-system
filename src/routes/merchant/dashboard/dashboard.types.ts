// merchant/dashboard/dashboard.types.ts

export interface MerchantStats {
  netRevenue: number          // الأرباح الصافية بالدينار
  pendingPackaging: number    // طلبيات تنتظر التغليف
  deliveryRate: number        // معدل التوصيل (0-100)
  returnRate: number          // معدل الروتور (0-100)
}

export interface ChartDataPoint {
  date: string                // "2025-01-15"
  delivered: number           // طلبيات مُسلّمة
  returned: number            // طلبيات مُرتجعة
}

export interface RecentOrder {
  id: string
  wilaya: string
  productName: string
  status: 'pending' | 'shipped' | 'delivered' | 'returned'
  createdAt: string
}

export interface LowStockProduct {
  id: string
  name: string
  stockQuantity: number
  threshold: number           // الحد الأدنى للتحذير
}

export interface MerchantDashboardData {
  stats: MerchantStats
  chartData: ChartDataPoint[]
  recentOrders: RecentOrder[]
  lowStockProducts: LowStockProduct[]
  topProducts: TopProduct[]           // ← جديد
}

// أضف هذا في نهاية الملف

export type DateRange = 'today' | '7days' | '30days'

export interface TopProduct {
  id: string
  name: string
  totalSold: number
  revenue: number
}