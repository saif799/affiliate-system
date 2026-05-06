// ============================================================
// wallet.types.ts
// ============================================================

export type TransactionType = 'commission' | 'withdrawal' | 'deduction'

export type WithdrawalStatus = 'pending' | 'completed' | 'rejected'

export type PaymentMethod = 'ccp' | 'bank'

export interface WalletBalance {
  available: number      // عمولات الطلبيات المُسلّمة فقط
  pending: number        // طلبيات قيد التوصيل
  totalEarned: number    // إجمالي الأرباح منذ البداية
  minWithdrawAmount: number // الحد الأدنى للسحب
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number         // موجب = دخل، سالب = خصم/سحب
  description: string
  orderId?: string       // موجود في حالة العمولة أو الخصم
  productName?: string
  date: string           // ISO string
}

export interface WithdrawalRequest {
  id: string             // WD-XXXX
  amount: number
  method: PaymentMethod
  accountNumber: string  // رقم CCP أو الحساب البنكي
  status: WithdrawalStatus
  date: string
  rejectionReason?: string
}

export interface WalletData {
  balance: WalletBalance
  transactions: Transaction[]
  withdrawals: WithdrawalRequest[]
}

export interface WithdrawFormData {
  amount: number
  method: PaymentMethod
  accountNumber: string
}