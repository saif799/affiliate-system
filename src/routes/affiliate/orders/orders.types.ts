export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'returned'

export interface AffiliateOrder {
  id: string
  date: string
  product: string
  productThumb: string
  sku: string
  customer: string
  phone: string
  wilaya: string
  price: number
  commission: number
  status: OrderStatus
}

export interface AddLeadForm {
  productId: string
  customerName: string
  customerPhone: string
  wilaya: string
  city: string
  salePrice: number
  notes?: string
}

export interface OrdersStats {
  total: number
  earnedComm: number
  inShipping: number
  deliveryRate: number
}

export interface OrdersPageData {
  orders: AffiliateOrder[]
  stats: OrdersStats
}