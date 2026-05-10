// ============================================================
// COMMISSIONS PAGE — TYPES
// ============================================================

// ---------- KPI Cards (القسم 1) ----------
export type CommissionStats = {
  totalPlatformEarnings: number      // إجمالي أرباح المنصة منذ الانطلاق
  currentMonthEarnings: number       // أرباح هذا الشهر
  previousMonthEarnings: number      // أرباح الشهر الماضي (لحساب % التغيير)
  merchantsPendingBalance: number    // مستحقات التجار المعلقة
  affiliatesPendingBalance: number   // مستحقات المسوّقين المعلقة
}

// ---------- Payment Breakdown (القسم 2) ----------
export type PaymentBreakdown = {
  totalPaid: number         // إجمالي ما تم دفعه (التجار + المسوّقون)
  totalPending: number      // إجمالي المعلق
  merchantPaid: number
  merchantPending: number
  affiliatePaid: number
  affiliatePending: number
  pendingByCCP: number          // المعلق عبر CCP
  pendingByBaridiMob: number    // المعلق عبر BaridiMob
  pendingCCPCount: number       // عدد طلبات CCP المعلقة
  pendingBaridiMobCount: number // عدد طلبات BaridiMob المعلقة
}

// ---------- Monthly Chart (القسم 3) ----------
export type MonthlyPayoutPoint = {
  month: string          // e.g. "يناير"
  merchantAmount: number
  affiliateAmount: number
}

// ---------- Withdrawal Requests (القسم 4) ----------
export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'

export type PayoutMethod = 'CCP' | 'BaridiMob'

export type WithdrawalRequest = {
  id: string
  userId: string
  userName: string
  userWilaya: string | null
  userRole: 'merchant' | 'affiliate'
  amount: number
  method: PayoutMethod
  accountNumber: string
  status: WithdrawalStatus
  requestedAt: string
  processedAt: string | null
  // بيانات إضافية للمسوّقين فقط
  fraudFlag: boolean
  refusalRate: number | null   // null إذا كان تاجراً
}

// ---------- Confirm Modal ----------
export type ConfirmPaymentPayload = {
  withdrawalId: string
  transactionRef: string   // رقم الإثبات الذي يدخله المدير
}

// ---------- Transaction History (القسم 5) ----------
export type TransactionRecord = {
  id: string
  txnRef: string           // TXN-2025-0116-001
  recipientName: string
  recipientRole: 'merchant' | 'affiliate'
  recipientWilaya: string | null
  amount: number
  method: PayoutMethod
  paidAt: string
}

// ---------- Full page data ----------
export type CommissionsPageData = {
  stats: CommissionStats
  breakdown: PaymentBreakdown
  monthlyPayouts: MonthlyPayoutPoint[]
  withdrawalRequests: WithdrawalRequest[]
  transactionHistory: TransactionRecord[]
}