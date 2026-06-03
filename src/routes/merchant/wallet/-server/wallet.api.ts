// merchant/wallet/-server/wallet.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  merchantProfiles,
  wallets,
  transactions,
  withdrawalRequests,
  settings,
} from '#/server/db/schema'
import { and, eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import type {
  WalletData,
  Transaction,
  TransactionType,
  TransactionStatus,
  PayoutRequest,
  PayoutStatus,
  PayoutMethodOption,
} from '../-wallet.types'

// ============================================================
// HELPERS
// ============================================================

async function requireMerchant() {
  const session = await getSession()
  if (!session || session.user.role !== 'merchant') throw new Error('Unauthorized')

  const [profile] = await db
    .select({ id: merchantProfiles.id })
    .from(merchantProfiles)
    .where(eq(merchantProfiles.user_id, session.user.id))
    .limit(1)

  if (!profile) throw new Error('Merchant profile not found')
  return { session, profileId: profile.id }
}

const n = (v: unknown) => Number(v ?? 0)
const ref = (id: string, prefix: string) =>
  `${prefix}-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

const TXN_TYPE_MAP: Record<string, TransactionType | null> = {
  merchant_earning: 'order_earning',
  withdrawal: 'payout_deduction',
  refund: 'refund_deduction',
  platform_fee: 'platform_fee',
  commission: null, // affiliate-only, not shown in merchant wallet
}

const TXN_STATUS_MAP: Record<string, TransactionStatus> = {
  pending: 'pending',
  completed: 'completed',
  reversed: 'failed',
}

const PAYOUT_STATUS_MAP: Record<string, PayoutStatus> = {
  paid: 'completed',
  approved: 'pending',
  pending: 'pending',
  rejected: 'rejected',
}

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  CCP: 'CCP / بريد الجزائر',
  BaridiMob: 'BaridiMob',
}

const PAYOUT_METHODS: PayoutMethodOption[] = [
  { id: 'CCP', label: 'CCP / بريد الجزائر', accountInfo: 'رقم الحساب البريدي' },
  { id: 'BaridiMob', label: 'BaridiMob', accountInfo: 'رقم الهاتف المرتبط' },
]

async function getMinimumPayout(): Promise<number> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'minimum_payout'))
    .limit(1)
  return row ? Number(row.value) : 5000
}

// ============================================================
// GET WALLET DATA
// ============================================================

export const getWalletData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<WalletData> => {
    const { session } = await requireMerchant()
    const userId = session.user.id

    const [wallet] = await db
      .select({
        id: wallets.id,
        available: wallets.available_balance_dzd,
        pending: wallets.pending_balance_dzd,
      })
      .from(wallets)
      .where(eq(wallets.user_id, userId))
      .limit(1)

    const [withdrawnRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${withdrawalRequests.amount_dzd}), 0)`,
      })
      .from(withdrawalRequests)
      .where(
        and(eq(withdrawalRequests.user_id, userId), eq(withdrawalRequests.status, 'paid')),
      )

    const minimumPayout = await getMinimumPayout()

    // transactions (scoped to this merchant's wallet)
    const txnRows = wallet
      ? await db
          .select({
            id: transactions.id,
            orderId: transactions.order_id,
            type: transactions.type,
            status: transactions.status,
            amount: transactions.amount_dzd,
            description: transactions.description,
            createdAt: transactions.created_at,
          })
          .from(transactions)
          .where(eq(transactions.wallet_id, wallet.id))
          .orderBy(desc(transactions.created_at))
          .limit(50)
      : []

    const txnList: Transaction[] = txnRows
      .map((r): Transaction | null => {
        const mappedType = TXN_TYPE_MAP[r.type]
        if (!mappedType) return null
        const abs = Math.abs(r.amount)
        const amount = mappedType === 'order_earning' ? abs : -abs
        return {
          id: r.id,
          reference: ref(r.id, 'TXN'),
          orderId: r.orderId ?? undefined,
          orderNumber: r.orderId ? ref(r.orderId, 'ORD') : undefined,
          type: mappedType,
          amount,
          status: TXN_STATUS_MAP[r.status] ?? 'pending',
          description: r.description ?? '',
          createdAt: r.createdAt.toISOString(),
        }
      })
      .filter((t): t is Transaction => t !== null)

    // payout history
    const payoutRows = await db
      .select({
        id: withdrawalRequests.id,
        amount: withdrawalRequests.amount_dzd,
        method: withdrawalRequests.method,
        status: withdrawalRequests.status,
        requestedAt: withdrawalRequests.requested_at,
        processedAt: withdrawalRequests.processed_at,
      })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.user_id, userId))
      .orderBy(desc(withdrawalRequests.requested_at))

    const payoutHistory: PayoutRequest[] = payoutRows.map((r) => ({
      id: r.id,
      reference: ref(r.id, 'PAY'),
      amount: r.amount,
      fee: 0,
      netAmount: r.amount,
      method: r.method,
      methodLabel: PAYOUT_METHOD_LABEL[r.method] ?? r.method,
      status: PAYOUT_STATUS_MAP[r.status] ?? 'pending',
      requestedAt: r.requestedAt.toISOString(),
      processedAt: r.processedAt ? r.processedAt.toISOString() : undefined,
    }))

    return {
      stats: {
        availableBalance: n(wallet?.available),
        pendingBalance: n(wallet?.pending),
        totalWithdrawn: n(withdrawnRow.total),
        minimumPayout,
      },
      transactions: txnList,
      payoutHistory,
      payoutMethods: PAYOUT_METHODS,
    }
  },
)

// ============================================================
// REQUEST WITHDRAWAL
// ============================================================

const WithdrawalSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(['CCP', 'BaridiMob']),
  accountNumber: z.string().min(5),
})

export const requestWithdrawal = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => WithdrawalSchema.parse(input))
  .handler(async ({ data }) => {
    const { session } = await requireMerchant()
    const userId = session.user.id

    const minimumPayout = await getMinimumPayout()
    if (data.amount < minimumPayout)
      throw new Error(`الحد الأدنى للسحب هو ${minimumPayout} DZD`)

    await db.transaction(async (tx) => {
      const [wallet] = await tx
        .select({
          available: wallets.available_balance_dzd,
          pending: wallets.pending_balance_dzd,
        })
        .from(wallets)
        .where(eq(wallets.user_id, userId))
        .for('update')
        .limit(1)

      if (!wallet) throw new Error('المحفظة غير موجودة')
      if (wallet.available < data.amount) throw new Error('الرصيد غير كافٍ')

      await tx.insert(withdrawalRequests).values({
        user_id: userId,
        amount_dzd: data.amount,
        method: data.method,
        account_number: data.accountNumber,
        status: 'pending',
      })

      await tx
        .update(wallets)
        .set({
          available_balance_dzd: wallet.available - data.amount,
          pending_balance_dzd: wallet.pending + data.amount,
        })
        .where(eq(wallets.user_id, userId))
    })

    return { success: true }
  })
