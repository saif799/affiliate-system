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

// ⚠️ التاجر لا يرى أيّ بيانات شخصية للزبون (اسم/هاتف/عنوان/بلدية منزلية/ملاحظة).
// يرى فقط: المرجع، المنتج، الكمية، الولاية، نوع التوصيل، اسم المكتب (إن وُجد)،
// الحالة، رقم التتبّع. التعقيم يتمّ في #/server/privacy/order-views.
export interface Order {
  id: string
  createdAt: string
  product: {
    name: string
    variant: string // مقاس، لون...
  }
  wilaya: string
  deliveryType: 'home' | 'office' // نوع التوصيل
  officeName?: string // اسم بلدية/مكتب الاستلام (ليس PII) — للتوصيل المكتبي فقط
  quantity: number
  totalPrice: number // سعر البيع النهائي
  merchantEarnings: number // حصة التاجر
  status: OrderStatus // UI-collapsed status (4 visible states)
  dbStatus: DbOrderStatus // real DB status — drives valid transitions
  trackingNumber?: string
  internalShipmentId?: string // مرجع الشحنة الداخلي (Phase 5)
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
