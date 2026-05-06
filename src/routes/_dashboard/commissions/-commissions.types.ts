// ─── Enums ────────────────────────────────────────────

export type PayoutStatus =
  | 'pending'    // طلب جديد لم يُعالج
  | 'verifying'  // تم رفع الوصل — بانتظار تأكيد الاستلام
  | 'paid'       // مكتمل
  | 'rejected'   // مرفوض

export type PaymentMethod = 'baridimob' | 'ccp'

export type BeneficiaryType = 'affiliate' | 'merchant'

// ─── KPI Cards ────────────────────────────────────────

export interface CommissionMetric {
  value:  number  // DZD أو عدد
  change: number  // نسبة مئوية مقارنة بالشهر الماضي
}

export interface CommissionStats {
  pendingPayouts:    CommissionMetric  // إجمالي الرصيد المعلق (DZD)
  totalPaid:         CommissionMetric  // إجمالي المدفوع منذ الإطلاق (DZD)
  platformRevenue:   CommissionMetric  // صافي ربح المنصة (DZD)
  pendingRequests:   CommissionMetric  // عدد الطلبات بانتظار المراجعة
}

// ─── Payout Request ───────────────────────────────────

export interface PayoutRequest {
  id:               string
  beneficiaryName:  string
  beneficiaryType:  BeneficiaryType
  amount:           number          // DZD
  paymentMethod:    PaymentMethod
  accountNumber:    string          // رقم RIP (20 رقم) أو CCP (10 أرقام)
  status:           PayoutStatus
  requestedAt:      string          // تاريخ الطلب
  processedAt?:     string          // تاريخ المعالجة (paid أو rejected)
  receiptUrl?:      string          // رابط صورة وصل التحويل
  rejectionReason?: string          // سبب الرفض — إلزامي عند الرفض
  wilaya:           string
}

// ─── Transaction (History) ────────────────────────────

export interface Transaction {
  id:              string
  referenceNumber: string           // رقم مرجعي للأرشيف المحاسبي
  beneficiaryName: string
  beneficiaryType: BeneficiaryType
  amount:          number           // DZD
  paymentMethod:   PaymentMethod
  paidAt:          string
  wilaya:          string
}

// ─── Monthly Payouts Chart ────────────────────────────

export interface MonthlyPayout {
  month:           string           // "Jan" | "Feb" ...
  affiliatePayout: number           // DZD مدفوع للمسوقين
  merchantPayout:  number           // DZD مدفوع للتجار
}

// ─── Root ─────────────────────────────────────────────

export interface CommissionsData {
  stats:           CommissionStats
  payoutRequests:  PayoutRequest[]
  transactions:    Transaction[]
  monthlyPayouts:  MonthlyPayout[]
}