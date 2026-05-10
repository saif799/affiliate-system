// src/routes/_dashboard/campaigns/-campaigns.types.ts

export type ProductStatus = 'active' | 'suspended'

// ============================================================
// ProductStatsMetric
//
// value        = الإجمالي الحالي (دقيق 100%)
// newThisMonth = عدد المنشأة هذا الشهر تحديداً
// changeVsPrev = نسبة التغيير في newThisMonth مقارنةً بالشهر الماضي
//
// لماذا changeVsPrev يقيس المنشأة وليس الإجمالي؟
// الـ schema لا يحتوي على is_active_changed_at أو suspended_at،
// لذا لا يمكن معرفة الإجمالي الدقيق في تاريخ سابق معين.
// changeVsPrev يجيب عن: "هل نشاط الإضافة زاد هذا الشهر؟"
//
// null في changeVsPrev = لا يوجد بيانات الشهر الماضي للمقارنة
// (مثلاً: 0 منتج الشهر الماضي و5 هذا الشهر = نمو لا نهائي)
// الـ frontend يعرضه كـ "—" أو "جديد".
// ============================================================

export interface ProductStatsMetric {
  value:        number       // الإجمالي الحالي
  newThisMonth: number       // المنشأة هذا الشهر
  changeVsPrev: number | null // % مقارنة بالشهر الماضي — null = لا مقارنة ممكنة
}

export interface ProductStats {
  total:           ProductStatsMetric
  active:          ProductStatsMetric
  suspended:       ProductStatsMetric
  highReturnCount: ProductStatsMetric
}

// ============================================================
// Product
// ناتج JOIN بين:
// products + merchant_profiles + users (wilaya) + orders (aggregated)
// ============================================================

export interface Product {
  id:             string
  name:           string
  category:       string | null
  merchantName:   string
  merchantWilaya: string
  priceDzd:       number
  stockQty:       number
  isActive:       boolean
  returnRate:     number       // 0-100، محسوبة من orders
  conversions:    number       // COUNT(orders WHERE status = 'delivered')
  createdAt:      string       // ISO date string (YYYY-MM-DD)
}

export interface ProductsData {
  stats:    ProductStats
  products: Product[]
}