import type { OrdersPageData } from '../orders.types'

export const mockOrdersData: OrdersPageData = {
  stats: {
    total: 47,
    pendingComm: 74500,
    inShipping: 12,
    deliveryRate: 76,
  },
  orders: [
    {
      id: 'ORD-0047', date: '2026-04-20',
      product: 'جاكيت جلد كلاسيكي', productThumb: '🧥', sku: 'JKT-001',
      customer: 'أحمد بن سالم', phone: '0551234567', wilaya: 'الجزائر',
      price: 12000, commission: 3000, status: 'delivered',
    },
    // ... باقي الطلبيات
  ],
}