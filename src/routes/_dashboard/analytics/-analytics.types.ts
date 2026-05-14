// ── Date range ────────────────────────────────────────────────

export type DateRange = 'this_week' | 'this_month' | 'this_year'

// ── Platform KPIs ─────────────────────────────────────────────

export interface PlatformKpis {
  gmv_dzd:                  number
  gmv_change_pct:           number | null

  take_rate_pct:            number
  take_rate_change_pct:     number | null

  delivery_rate_pct:        number
  delivery_rate_change_pct: number | null

  orders_total:             number
  orders_change_pct:        number | null
  orders_delivered:         number
  orders_returned:          number

  pending_withdrawals_dzd:  number
}

// ── GMV series ────────────────────────────────────────────────

export interface GmvPoint {
  date:    string
  gmv_dzd: number
}

// ── Top affiliates ────────────────────────────────────────────

export interface TopAffiliate {
  affiliate_id:     string
  name:             string
  wilaya:           string
  revenue_dzd:      number
  orders_delivered: number
  orders_total:     number
  refusal_rate_pct: number
}

// ── Top merchants ─────────────────────────────────────────────

export interface TopMerchant {
  merchant_id:     string
  business_name:   string
  // إجمالي مبيعات التاجر على delivered — رسوم المنصة غير مخصومة
  revenue_dzd:     number
  orders_total:    number
  return_rate_pct: number
}

// ── Wilaya stats ──────────────────────────────────────────────

export interface WilayaStat {
  wilaya:          string
  orders_count:    number
  return_rate_pct: number
}

// ── Delivery timing ───────────────────────────────────────────

export interface DeliveryTiming {
  avg_confirm_hours:  number
  avg_ship_hours:     number
  avg_wilaya_hours:   number
  avg_deliver_hours:  number
  avg_total_days:     number
  // عدد الطلبات الكلي المُحسَّب عليها (كلها delivered بحكم WHERE)
  sample_size:        number
  // عدد الصفوف الفعلية لكل مرحلة — قد يقل عن sample_size إن كانت timestamps ناقصة
  // مفيد في الواجهة لإظهار تحذير بجانب المتوسط عند بيانات غير مكتملة
  sample_confirm:     number
  sample_ship:        number
  sample_wilaya:      number
  sample_deliver:     number
}

// ── Full analytics response ───────────────────────────────────

export interface AnalyticsData {
  range:           DateRange
  kpis:            PlatformKpis
  gmv_series:      GmvPoint[]
  top_affiliates:  TopAffiliate[]
  top_merchants:   TopMerchant[]
  wilaya_stats:    WilayaStat[]
  delivery_timing: DeliveryTiming
}