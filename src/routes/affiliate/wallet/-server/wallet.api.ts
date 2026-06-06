// ============================================================
// affiliate/wallet/-server/wallet.api.ts
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  affiliateProfiles,
  wallets,
  transactions,
  withdrawalRequests,
  settings,
} from '#/server/db/schema'
import { eq, sql, desc, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { releaseMaturedFunds } from '#/server/settlement'
import { notifySuperAdmins } from '#/server/notify'
import type {
  WalletData,
  Transaction,
  TransactionType,
  WithdrawalRequest,
  WithdrawalStatus,
  PaymentMethod,
} from '../-wallet.types'

// ============================================================
// HELPERS
// ============================================================

async function requireAffiliate() {
  const session = await getSession()
  if (!session || session.user.role !== 'affiliate')
    throw new Error('Unauthorized')

  const [profile] = await db
    .select({ id: affiliateProfiles.id })
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.user_id, session.user.id))
    .limit(1)

  if (!profile) throw new Error('Affiliate profile not found')
  return { session, profileId: profile.id }
}

const n = (v: unknown) => Number(v ?? 0)
const ref = (id: string, prefix: string) =>
  `${prefix}-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

// DB transaction type → نوع المعاملة في واجهة المسوّق (null = لا تُعرض)
const TXN_TYPE_MAP: Record<string, TransactionType | null> = {
  commission: 'commission',
  withdrawal: 'withdrawal',
  refund: 'deduction',
  merchant_earning: null, // خاص بالتاجر
  platform_fee: null, // خاص بالمنصة
}

const WITHDRAWAL_STATUS_MAP: Record<string, WithdrawalStatus> = {
  paid: 'completed',
  approved: 'pending',
  pending: 'pending',
  rejected: 'rejected',
}

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
    const { session } = await requireAffiliate()
    const userId = session.user.id

    // حرّر أي أرباح انقضت مدّة حجزها (pending → available) قبل العرض
    await releaseMaturedFunds(userId)

    const [wallet] = await db
      .select({
        id: wallets.id,
        available: wallets.available_balance_dzd,
        pending: wallets.pending_balance_dzd,
      })
      .from(wallets)
      .where(eq(wallets.user_id, userId))
      .limit(1)

    const minWithdrawAmount = await getMinimumPayout()

    // إجمالي الأرباح = كل العمولات (المحجوزة + المُحرَّرة) منذ البداية
    const [earnedRow] = wallet
      ? await db
          .select({
            total: sql<number>`COALESCE(SUM(${transactions.amount_dzd}) FILTER (WHERE ${transactions.type} = 'commission' AND ${transactions.status} <> 'reversed'), 0)`,
          })
          .from(transactions)
          .where(eq(transactions.wallet_id, wallet.id))
      : [{ total: 0 }]

    // سجل المعاملات (مرتبط بمحفظة المسوّق)
    const txnRows = wallet
      ? await db
          .select({
            id: transactions.id,
            orderId: transactions.order_id,
            type: transactions.type,
            amount: transactions.amount_dzd,
            description: transactions.description,
            createdAt: transactions.created_at,
          })
          .from(transactions)
          .where(eq(transactions.wallet_id, wallet.id))
          .orderBy(desc(transactions.created_at))
          .limit(50)
      : []

    const transactionsList: Transaction[] = txnRows
      .map((r): Transaction | null => {
        const mappedType = TXN_TYPE_MAP[r.type]
        if (!mappedType) return null
        const abs = Math.abs(r.amount)
        const amount = mappedType === 'commission' ? abs : -abs
        return {
          id: r.id,
          type: mappedType,
          amount,
          description: r.description ?? '',
          orderId: r.orderId ? ref(r.orderId, 'ORD') : undefined,
          date: r.createdAt.toISOString(),
        }
      })
      .filter((t): t is Transaction => t !== null)

    // تاريخ السحوبات
    const withdrawalRows = await db
      .select({
        id: withdrawalRequests.id,
        amount: withdrawalRequests.amount_dzd,
        method: withdrawalRequests.method,
        accountNumber: withdrawalRequests.account_number,
        status: withdrawalRequests.status,
        requestedAt: withdrawalRequests.requested_at,
      })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.user_id, userId))
      .orderBy(desc(withdrawalRequests.requested_at))

    const withdrawals: WithdrawalRequest[] = withdrawalRows.map((r) => ({
      id: ref(r.id, 'WD'),
      amount: r.amount,
      method: r.method as PaymentMethod,
      accountNumber: r.accountNumber,
      status: WITHDRAWAL_STATUS_MAP[r.status] ?? 'pending',
      date: r.requestedAt.toISOString(),
    }))

    return {
      balance: {
        available: n(wallet?.available),
        pending: n(wallet?.pending),
        totalEarned: n(earnedRow?.total),
        minWithdrawAmount,
      },
      transactions: transactionsList,
      withdrawals,
    }
  },
)

// ============================================================
// CREATE WITHDRAWAL REQUEST
// ============================================================

const WithdrawalSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(['CCP', 'BaridiMob']),
  accountNumber: z.string().min(5),
})

export const createWithdrawalRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => WithdrawalSchema.parse(input))
  .handler(async ({ data }): Promise<WithdrawalRequest> => {
    const { session } = await requireAffiliate()
    const userId = session.user.id

    const minimumPayout = await getMinimumPayout()
    if (data.amount < minimumPayout)
      throw new Error(`الحد الأدنى للسحب هو ${minimumPayout} د.ج`)

    // منع تعدّد طلبات السحب المعلّقة (rate limiting طبيعي + حماية)
    const [openReq] = await db
      .select({ id: withdrawalRequests.id })
      .from(withdrawalRequests)
      .where(
        and(
          eq(withdrawalRequests.user_id, userId),
          inArray(withdrawalRequests.status, ['pending', 'approved']),
        ),
      )
      .limit(1)
    if (openReq)
      throw new Error('لديك طلب سحب قيد المعالجة بالفعل — انتظر حتى تتم معالجته')

    // حرّر المستحقّ المنتهية مدّته أولاً، ثم نفّذ السحب على الرصيد المُحدَّث
    await releaseMaturedFunds(userId)

    const created = await db.transaction(async (tx) => {
      const [wallet] = await tx
        .select({
          available: wallets.available_balance_dzd,
        })
        .from(wallets)
        .where(eq(wallets.user_id, userId))
        .for('update')
        .limit(1)

      if (!wallet) throw new Error('المحفظة غير موجودة')

      // تحقّق نهائي داخل القفل يمنع سباق طلبَي سحب متزامنين لنفس المستخدم
      const [openInTx] = await tx
        .select({ id: withdrawalRequests.id })
        .from(withdrawalRequests)
        .where(
          and(
            eq(withdrawalRequests.user_id, userId),
            inArray(withdrawalRequests.status, ['pending', 'approved']),
          ),
        )
        .limit(1)
      if (openInTx)
        throw new Error('لديك طلب سحب قيد المعالجة بالفعل — انتظر حتى تتم معالجته')

      if (wallet.available < data.amount) throw new Error('الرصيد غير كافٍ')

      const [row] = await tx
        .insert(withdrawalRequests)
        .values({
          user_id: userId,
          amount_dzd: data.amount,
          method: data.method,
          account_number: data.accountNumber,
          status: 'pending',
        })
        .returning({ id: withdrawalRequests.id, requestedAt: withdrawalRequests.requested_at })

      // المبلغ يُخصم من available ويُتتبَّع عبر جدول طلبات السحب
      await tx
        .update(wallets)
        .set({ available_balance_dzd: wallet.available - data.amount })
        .where(eq(wallets.user_id, userId))

      return row
    })

    // إشعار الأدمن بطلب السحب الجديد (best-effort)
    await notifySuperAdmins({
      type: 'withdrawal_request',
      title: 'طلب سحب جديد',
      body: `${session.user.name} (مسوّق) طلب سحب ${data.amount.toLocaleString('ar-DZ')} د.ج عبر ${data.method}`,
      link: '/commissions',
    })

    return {
      id: ref(created.id, 'WD'),
      amount: data.amount,
      method: data.method,
      accountNumber: data.accountNumber,
      status: 'pending',
      date: created.requestedAt.toISOString(),
    }
  })
