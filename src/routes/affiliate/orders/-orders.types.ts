export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'returned'

// حالة قاعدة البيانات الكاملة — للخطّ الزمني التفصيلي في نافذة التفاصيل
export type DbOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'at_wilaya'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'disputed'

export interface AffiliateOrder {
  id: string
  rawId: string        // UUID الحقيقي — يُستخدم في إجراءات التأكيد/الرفض
  date: string
  product: string
  productThumb: string
  sku: string
  merchantName: string // التاجر الذي تُرسَل إليه الطلبية
  customer: string
  phone: string
  wilaya: string
  quantity: number
  basePrice: number    // سعر الجملة للوحدة
  price: number        // سعر البيع الإجمالي
  commission: number
  status: OrderStatus
  dbStatus: DbOrderStatus
  needsAction: boolean // true إذا كانت بانتظار تأكيد المسوّق (DB pending)
  trackingNumber: string | null
  // الخطّ الزمني (ISO أو null)
  createdAt: string
  confirmedAt: string | null
  shippedAt: string | null
  atWilayaAt: string | null
  deliveredAt: string | null
}

export interface AddLeadForm {
  productId: string
  customerName: string
  customerPhone: string
  wilayaCode: number // رمز الولاية لدى ECOTRACK (1..58)
  wilayaName: string // اسم الولاية (للعرض/التخزين)
  commune: string // بلدية مطابقة لقائمة ECOTRACK
  address: string // العنوان (مطلوب للتوصيل المنزلي)
  salePrice: number
  notes?: string
}

export interface OrdersStats {
  total: number
  earnedComm: number
  inShipping: number
  deliveryRate: number
}

// منتج متاح لإنشاء طلبية يدوية (المسوّق يبيع بأي سعر ≥ سعر الجملة)
export interface LeadProduct {
  id: string
  name: string
  basePrice: number // سعر الجملة (التكلفة على المسوّق)
}

export interface TabCounts {
  all: number
  pending: number
  shipping: number
  delivered: number
  returned: number
}

export interface OrdersPageData {
  orders: AffiliateOrder[]
  stats: OrdersStats
}
// ملاحظة: إنشاء الطلبيات اليدوية يتم من سوق المنتجات (marketplace) حيث يُمرَّر
// المنتج المحدّد إلى AddLeadModal — صفحة الطلبيات لا تحتاج قائمة المنتجات.