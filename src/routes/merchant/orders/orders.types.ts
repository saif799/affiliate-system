// merchant/orders/orders.types.ts

export type OrderStatus =
  | 'pending'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled'

export type TabFilter = 'all' | 'pending' | 'shipped' | 'delivered' | 'returned'

export interface Order {
  id: string
  createdAt: string
  product: {
    name: string
    variant: string // مقاس، لون...
  }
  customer: {
    name: string
    phone: string
  }
  wilaya: string
  totalPrice: number // سعر البيع النهائي
  merchantEarnings: number // حصة التاجر
  status: OrderStatus
  trackingNumber?: string
}

export interface OrdersTabCount {
  all: number
  pending: number
  shipped: number
  delivered: number
  returned: number
}

export interface MerchantOrdersData {
  orders: Order[]
  tabCounts: OrdersTabCount
}
export type DateFilter = 'today' | 'week' | 'month' | 'all'

export interface BulkAction {
  type: 'print' | 'changeStatus'
  orderIds: string[]
}
