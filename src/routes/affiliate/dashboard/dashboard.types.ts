export type OrderStatus = 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'returned'

export interface DashboardStats {
  totalEarnings: number
  availableBalance: number
  deliveredRate: number
  retourRate: number
}

export interface TopMerchant {
  id: string
  name: string
  category: string
  deliveredRate: number
  retourRate: number
  totalOrders: number
  earnings: number
}

export interface RecentOrder {
  id: string
  orderId: string
  productName: string
  merchantName: string
  status: OrderStatus
  commission: number
  updatedAt: string
}

export interface AffiliateDashboardData {
  stats: DashboardStats
  topMerchants: TopMerchant[]
  recentOrders: RecentOrder[]
}