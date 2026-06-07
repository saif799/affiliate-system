// ============================================================
// src/server/privacy/order-views.ts  — SERVER ONLY
//
// طبقة تعقيم الطلبيات حسب الدور (RBAC — Phase 2).
//
// قاعدة المنصّة: **التاجر لا يرى أبداً** اسم الزبون أو هاتفه أو عنوانه أو
// بلديته المنزلية أو ملاحظته (أي PII). يرى فقط: المرجع، المنتج، الكمية،
// الولاية، نوع التوصيل، اسم المكتب (للتوصيل المكتبي)، الحالة، رقم التتبّع.
//
// `toMerchantOrderView` لا ينسخ أبداً حقول PII حتى لو وُجدت في الصفّ الخام
// (دفاع عميق: حتى لو سحب استعلامٌ ما عموداً حسّاساً بالخطأ، لا يخرج للتاجر).
// المسوّق والأدمن يريان كل شيء، فلا يحتاجان تعقيماً (دوال الهوية مُتروكة عمداً).
// ============================================================

import type { Order, OrderStatus, DbOrderStatus } from '#/routes/merchant/orders/-orders.types'

/** الصفّ الخام كما قد يأتي من DB — قد يحوي PII؛ لا يُنسَخ منه شيء حسّاس. */
export interface MerchantOrderRaw {
  id: string
  createdAt: Date | string
  productName: string
  productVariant?: string | null
  wilaya: string
  deliveryType: 'home' | 'office'
  officeName?: string | null
  quantity: number
  totalPrice: number
  merchantEarnings: number
  status: OrderStatus
  dbStatus: DbOrderStatus
  trackingNumber?: string | null
  internalShipmentId?: string | null
  // حقول PII محتملة — مُعلَنة كي يوثّق النوع أنّها تُهمَل عمداً، ولا تُنسَخ أبداً:
  customerName?: string | null
  customerPhone?: string | null
  customerAddress?: string | null
  customerCommune?: string | null
  customerNote?: string | null
}

const toDay = (d: Date | string): string =>
  typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)

/**
 * يحوّل صفّ طلبية إلى الشكل الذي يراه التاجر — خالٍ من أي PII.
 * اسم المكتب يظهر فقط للتوصيل المكتبي (وهو اسم بلدية/مكتب، ليس PII).
 */
export function toMerchantOrderView(r: MerchantOrderRaw): Order {
  return {
    id: r.id,
    createdAt: toDay(r.createdAt),
    product: { name: r.productName, variant: r.productVariant ?? '' },
    wilaya: r.wilaya,
    deliveryType: r.deliveryType,
    officeName: r.deliveryType === 'office' ? (r.officeName ?? undefined) : undefined,
    quantity: r.quantity,
    totalPrice: r.totalPrice,
    merchantEarnings: r.merchantEarnings,
    status: r.status,
    dbStatus: r.dbStatus,
    trackingNumber: r.trackingNumber ?? undefined,
    internalShipmentId: r.internalShipmentId ?? undefined,
  }
}
