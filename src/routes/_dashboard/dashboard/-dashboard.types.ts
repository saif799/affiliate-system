export interface StatMetric {
  value:     number
  growth:    number   // نسبة مئوية مقارنة بالشهر الماضي
  sparkline: number[]
}

export interface PlatformStats {
  totalMerchants:      StatMetric  // عدد المتاجر المسجّلة
  activeAffiliates:    StatMetric  // مسوّقون أجروا تحويلاً هذا الشهر
  totalGMV:            StatMetric  // Gross Merchandise Value بالـ DZD
  platformRevenue:     StatMetric  // عمولة المنصة من كل صفقة
  totalConversions:    StatMetric  // طلبات مكتملة عبر المنصة
  pendingCommissions:  StatMetric  // عمولات لم تُدفع بعد للـ Affiliates
}

// ─── Revenue Chart ────────────────────────────────────

export interface MonthlyRevenue {
  month:           string   // "Jan" | "Feb" ...
  gmv:             number   // إجمالي المبيعات
  platformRevenue: number   // عمولة المنصة
}

// ─── Top Affiliates ───────────────────────────────────

export interface TopAffiliate {
  id:          string
  name:        string
  wilaya:      string   // الولاية
  conversions: number
  revenue:     number   // DZD
}

// ─── Wilaya Distribution ─────────────────────────────

export interface WilayaStat {
  wilaya:      string   // "Alger" | "Oran" | ...
  conversions: number
  revenue:     number
}

// ─── Recent Activity ─────────────────────────────────

export type ActivityType =
  | 'conversion'      // تحويل جديد
  | 'new_merchant'    // متجر جديد انضم
  | 'new_affiliate'   // مسوّق جديد انضم
  | 'commission_paid' // عمولة دُفعت

export interface ActivityItem {
  id:        string
  type:      ActivityType
  actor:     string    // اسم الشخص
  wilaya:    string
  amount?:   number    // DZD — اختياري (ليس كل الأنشطة مالية)
  timestamp: string    // "منذ 5 دقائق"
}

// ─── Root ─────────────────────────────────────────────

export interface DashboardData {
  stats:           PlatformStats
  monthlyRevenue:  MonthlyRevenue[]
  topAffiliates:   TopAffiliate[]
  wilayaStats:     WilayaStat[]
  recentActivity:  ActivityItem[]
}
