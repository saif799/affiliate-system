export type TransactionType = 'order_earning' | 'payout_deduction' | 'platform_fee' | 'refund_deduction'
export type TransactionStatus = 'completed' | 'pending' | 'failed'
export type PayoutStatus = 'completed' | 'pending' | 'processing' | 'rejected'
export type PayoutMethod = 'bank_transfer' | 'ccp' | 'baridimob' | 'cash'

export interface Transaction {
  id: string
  reference: string
  orderId?: string
  orderNumber?: string
  type: TransactionType
  amount: number
  status: TransactionStatus
  description: string
  createdAt: string
}

export interface PayoutRequest {
  id: string
  reference: string
  amount: number
  fee: number
  netAmount: number
  method: PayoutMethod
  methodLabel: string
  status: PayoutStatus
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
}

export interface WalletStats {
  availableBalance: number
  pendingBalance: number
  totalWithdrawn: number
  minimumPayout: number
}

export interface PayoutMethodOption {
  id: PayoutMethod
  label: string
  fee: number
  feeType: 'fixed' | 'percentage'
  accountInfo: string
}

export interface WalletData {
  stats: WalletStats
  transactions: Transaction[]
  payoutHistory: PayoutRequest[]
  payoutMethods: PayoutMethodOption[]
}