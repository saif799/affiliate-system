// merchant/orders/orders.types.ts

export type OrderStatus =
  | 'pending'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled'

// Raw DB order status (orders.status enum)
export type DbOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'at_wilaya'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'disputed'

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
  commune?: string // بلدية التوصيل (ECOTRACK)
  address?: string // عنوان التوصيل
  note?: string // ملاحظة للتوصيل
  quantity: number
  totalPrice: number // سعر البيع النهائي
  merchantEarnings: number // حصة التاجر
  status: OrderStatus // UI-collapsed status (4 visible states)
  dbStatus: DbOrderStatus // real DB status — drives valid transitions
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
