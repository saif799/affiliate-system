// ─── KPI ─────────────────────────────────────────────

export interface AnalyticMetric {
  value:  number
  change: number  // نسبة مئوية مقارنة بالشهر الماضي
}

export interface AnalyticsKPIs {
  totalGMV:          AnalyticMetric  // DZD
  platformRevenue:   AnalyticMetric  // DZD
  takeRate:          AnalyticMetric  // نسبة مئوية
  affiliateRetention: AnalyticMetric // نسبة مئوية
}

// ─── GMV vs Revenue ───────────────────────────────────

export interface MonthlyProfitability {
  month:           string
  gmv:             number  // DZD
  platformRevenue: number  // DZD
  affiliatePayout: number  // DZD — ما دفعناه للمسوقين
}

// ─── Risk List ────────────────────────────────────────

export type RiskLevel = 'high' | 'medium' | 'low'

export interface AffiliateRisk {
  id:               string
  name:             string
  wilaya:           string
  totalOrders:      number
  cancelledOrders:  number
  cancellationRate: number  // نسبة مئوية
  riskLevel:        RiskLevel
}

export interface MerchantRisk {
  id:             string
  name:           string
  wilaya:         string
  receivedOrders: number
  rejectedOrders: number
  rejectionRate:  number  // نسبة مئوية
  riskLevel:      RiskLevel
}

// ─── Concentration Risk ───────────────────────────────

export interface ConcentrationItem {
  name:       string  // اسم المسوق أو التاجر
  revenue:    number  // DZD
  percentage: number  // نسبة من إجمالي المنصة
  cumulative: number  // تراكمي — لرسم Pareto
}

// ─── Conversion Funnel ────────────────────────────────

export interface FunnelStep {
  label: string
  count: number
  rate:  number  // نسبة التحويل من الخطوة السابقة
}

// ─── Geographic Return Rate ───────────────────────────

export interface WilayaReturnRate {
  wilaya:     string
  orders:     number
  returns:    number
  returnRate: number  // نسبة مئوية
  riskLevel:  RiskLevel
}

// ─── Affiliate Retention ─────────────────────────────

export interface MonthlyRetention {
  month:          string
  activeAffiliates: number
  retained:       number  // كانوا نشطين الشهر السابق ولا يزالون
  retentionRate:  number  // نسبة مئوية
}

// ─── Root ─────────────────────────────────────────────

export interface AnalyticsData {
  kpis:              AnalyticsKPIs
  monthlyProfitability: MonthlyProfitability[]
  affiliateRisks:    AffiliateRisk[]
  merchantRisks:     MerchantRisk[]
  affiliateConcentration: ConcentrationItem[]
  merchantConcentration:  ConcentrationItem[]
  conversionFunnel:  FunnelStep[]
  wilayaReturnRates: WilayaReturnRate[]
  monthlyRetention:  MonthlyRetention[]
}