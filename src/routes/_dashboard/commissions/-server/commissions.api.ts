import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import { requireSuperAdmin } from '#/server/auth/guards'
import { notify } from '#/server/notify'
import {
  users,
  wallets,
  withdrawalRequests,
  transactions,
  affiliateProfiles,
  orders,
  products,
} from '#/server/db/schema'
import { eq, sql, sum, count, and, desc, lt, gte } from 'drizzle-orm'
import type {
  CommissionsPageData,
  CommissionStats,
  PaymentBreakdown,
  MonthlyPayoutPoint,
  WithdrawalRequest,
  TransactionRecord,
  EarningSourceItem,
} from '../-commissions.types'

// ============================================================
// HELPERS
// ============================================================

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

async function fetchStats(): Promise<CommissionStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // إيراد المنصة = مجموع رسوم الطلبات المُسلَّمة (مصدر واحد متّسق مع لوحة التحكم)
  const [totalResult] = await db
    .select({ total: sum(orders.platform_fee_dzd) })
    .from(orders)
    .where(eq(orders.status, 'delivered'))

  const [currentMonthResult] = await db
    .select({ total: sum(orders.platform_fee_dzd) })
    .from(orders)
    .where(
      and(eq(orders.status, 'delivered'), gte(orders.created_at, startOfMonth)),
    )

  const [prevMonthResult] = await db
    .select({ total: sum(orders.platform_fee_dzd) })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'delivered'),
        gte(orders.created_at, startOfLastMonth),
        lt(orders.created_at, startOfMonth),
      ),
    )

  // مستحقات التجار: مجموع pending_balance في محافظ المستخدمين من نوع merchant
  const [merchantPendingResult] = await db
    .select({ total: sum(wallets.pending_balance_dzd) })
    .from(wallets)
    .innerJoin(users, eq(wallets.user_id, users.id))
    .where(eq(users.role, 'merchant'))

  // مستحقات المسوّقين
  const [affiliatePendingResult] = await db
    .select({ total: sum(wallets.pending_balance_dzd) })
    .from(wallets)
    .innerJoin(users, eq(wallets.user_id, users.id))
    .where(eq(users.role, 'affiliate'))

  return {
    totalPlatformEarnings: Number(totalResult?.total ?? 0),
    currentMonthEarnings: Number(currentMonthResult?.total ?? 0),
    previousMonthEarnings: Number(prevMonthResult?.total ?? 0),
    merchantsPendingBalance: Number(merchantPendingResult?.total ?? 0),
    affiliatesPendingBalance: Number(affiliatePendingResult?.total ?? 0),
  }
}

async function fetchBreakdown(): Promise<PaymentBreakdown> {
  const [merchantPaidResult] = await db
    .select({ total: sum(withdrawalRequests.amount_dzd) })
    .from(withdrawalRequests)
    .innerJoin(users, eq(withdrawalRequests.user_id, users.id))
    .where(
      and(eq(withdrawalRequests.status, 'paid'), eq(users.role, 'merchant')),
    )

  const [affiliatePaidResult] = await db
    .select({ total: sum(withdrawalRequests.amount_dzd) })
    .from(withdrawalRequests)
    .innerJoin(users, eq(withdrawalRequests.user_id, users.id))
    .where(
      and(eq(withdrawalRequests.status, 'paid'), eq(users.role, 'affiliate')),
    )

  const [merchantPendingResult] = await db
    .select({ total: sum(wallets.pending_balance_dzd) })
    .from(wallets)
    .innerJoin(users, eq(wallets.user_id, users.id))
    .where(eq(users.role, 'merchant'))

  const [affiliatePendingResult] = await db
    .select({ total: sum(wallets.pending_balance_dzd) })
    .from(wallets)
    .innerJoin(users, eq(wallets.user_id, users.id))
    .where(eq(users.role, 'affiliate'))

  const methodBreakdown = await db
    .select({
      method: withdrawalRequests.method,
      total: sum(withdrawalRequests.amount_dzd),
      cnt: count(withdrawalRequests.id),
    })
    .from(withdrawalRequests)
    .where(sql`${withdrawalRequests.status} IN ('pending', 'approved')`)
    .groupBy(withdrawalRequests.method)

  const ccp = methodBreakdown.find((r) => r.method === 'CCP')
  const baridimob = methodBreakdown.find((r) => r.method === 'BaridiMob')

  const merchantPaid = Number(merchantPaidResult?.total ?? 0)
  const affiliatePaid = Number(affiliatePaidResult?.total ?? 0)
  const merchantPending = Number(merchantPendingResult?.total ?? 0)
  const affiliatePending = Number(affiliatePendingResult?.total ?? 0)

  return {
    totalPaid: merchantPaid + affiliatePaid,
    totalPending: merchantPending + affiliatePending,
    merchantPaid,
    merchantPending,
    affiliatePaid,
    affiliatePending,
    pendingByCCP: Number(ccp?.total ?? 0),
    pendingByBaridiMob: Number(baridimob?.total ?? 0),
    pendingCCPCount: Number(ccp?.cnt ?? 0),
    pendingBaridiMobCount: Number(baridimob?.cnt ?? 0),
  }
}

async function fetchMonthlyPayouts(): Promise<MonthlyPayoutPoint[]> {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
  twelveMonthsAgo.setDate(1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${withdrawalRequests.processed_at})`,
      year: sql<number>`EXTRACT(YEAR FROM ${withdrawalRequests.processed_at})`,
      role: users.role,
      total: sum(withdrawalRequests.amount_dzd),
    })
    .from(withdrawalRequests)
    .innerJoin(users, eq(withdrawalRequests.user_id, users.id))
    .where(
      and(
        eq(withdrawalRequests.status, 'paid'),
        gte(withdrawalRequests.processed_at, twelveMonthsAgo),
        sql`${withdrawalRequests.processed_at} IS NOT NULL`,
      ),
    )
    .groupBy(
      sql`EXTRACT(YEAR FROM ${withdrawalRequests.processed_at})`,
      sql`EXTRACT(MONTH FROM ${withdrawalRequests.processed_at})`,
      users.role,
    )
    .orderBy(
      sql`EXTRACT(YEAR FROM ${withdrawalRequests.processed_at})`,
      sql`EXTRACT(MONTH FROM ${withdrawalRequests.processed_at})`,
    )

  const map = new Map<string, { merchant: number; affiliate: number }>()

  for (const row of rows) {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, { merchant: 0, affiliate: 0 })
    const entry = map.get(key)!
    if (row.role === 'merchant') entry.merchant = Number(row.total ?? 0)
    if (row.role === 'affiliate') entry.affiliate = Number(row.total ?? 0)
  }

  return Array.from(map.entries()).map(([key, val]) => {
    const monthNum = parseInt(key.split('-')[1], 10) - 1
    return {
      month: ARABIC_MONTHS[monthNum] ?? key,
      merchantAmount: val.merchant,
      affiliateAmount: val.affiliate,
    }
  })
}

async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const rows = await db
    .select({
      id: withdrawalRequests.id,
      userId: withdrawalRequests.user_id,
      userName: users.name,
      userWilaya: users.wilaya,
      userRole: users.role,
      amount: withdrawalRequests.amount_dzd,
      method: withdrawalRequests.method,
      accountNumber: withdrawalRequests.account_number,
      status: withdrawalRequests.status,
      requestedAt: withdrawalRequests.requested_at,
      processedAt: withdrawalRequests.processed_at,
      fraudFlag: affiliateProfiles.fraud_flag,
      refusalRate: affiliateProfiles.refusal_rate,
    })
    .from(withdrawalRequests)
    .innerJoin(users, eq(withdrawalRequests.user_id, users.id))
    .leftJoin(affiliateProfiles, eq(affiliateProfiles.user_id, users.id))
    .orderBy(desc(withdrawalRequests.requested_at))
    .limit(50)

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userWilaya: r.userWilaya,
    userRole: r.userRole as 'merchant' | 'affiliate',
    amount: r.amount,
    method: r.method,
    accountNumber: r.accountNumber,
    status: r.status as WithdrawalRequest['status'],
    requestedAt: r.requestedAt.toISOString(),
    processedAt: r.processedAt?.toISOString() ?? null,
    fraudFlag: r.fraudFlag ?? false,
    refusalRate: r.refusalRate !== null ? Number(r.refusalRate) : null,
  }))
}

async function fetchTransactionHistory(): Promise<TransactionRecord[]> {
  const rows = await db
    .select({
      id: withdrawalRequests.id,
      amount: withdrawalRequests.amount_dzd,
      method: withdrawalRequests.method,
      processedAt: withdrawalRequests.processed_at,
      userName: users.name,
      userWilaya: users.wilaya,
      userRole: users.role,
    })
    .from(withdrawalRequests)
    .innerJoin(users, eq(withdrawalRequests.user_id, users.id))
    .where(eq(withdrawalRequests.status, 'paid'))
    .orderBy(desc(withdrawalRequests.processed_at))
    .limit(30)

  return rows.map((r, i) => {
    const date = r.processedAt ?? new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    return {
      id: r.id,
      txnRef: `TXN-${dateStr.slice(0, 8)}-${String(i + 1).padStart(3, '0')}`,
      recipientName: r.userName,
      recipientRole: r.userRole as 'merchant' | 'affiliate',
      recipientWilaya: r.userWilaya,
      amount: r.amount,
      method: r.method,
      paidAt: date.toISOString(),
    }
  })
}

export const getCommissionsPageData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CommissionsPageData> => {
    await requireSuperAdmin()

    const [stats, breakdown, monthlyPayouts, withdrawalReqs, history] =
      await Promise.all([
        fetchStats(),
        fetchBreakdown(),
        fetchMonthlyPayouts(),
        fetchWithdrawalRequests(),
        fetchTransactionHistory(),
      ])

    return {
      stats,
      breakdown,
      monthlyPayouts,
      withdrawalRequests: withdrawalReqs,
      transactionHistory: history,
    }
  },
)

export const confirmWithdrawal = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      withdrawalId: z.string().uuid(),
      transactionRef: z.string().min(4, 'رقم الإثبات مطلوب'),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()

    let paidUserId = ''
    let paidAmount = 0

    await db.transaction(async (tx) => {
      // قفل الصف لمنع المعالجة المزدوجة عند ضغطتين متزامنتين
      const [request] = await tx
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, data.withdrawalId))
        .for('update')
        .limit(1)

      if (!request) throw new Error('الطلب غير موجود')
      if (request.status === 'paid') throw new Error('تم دفع هذا الطلب مسبقاً')
      // الدفع لا يتم إلا بعد موافقة Super Admin (pending → approved → paid)
      if (request.status !== 'approved')
        throw new Error('يجب الموافقة على الطلب أولاً قبل تأكيد الدفع')

      const now = new Date()

      await tx
        .update(withdrawalRequests)
        .set({ status: 'paid', processed_at: now })
        .where(eq(withdrawalRequests.id, data.withdrawalId))

      // المبلغ خرج من available مسبقاً عند إنشاء الطلب — لا تعديل على الرصيد هنا.
      // نُسجّل المعاملة في السجل فقط (إثبات الصرف).
      const [wallet] = await tx
        .select({ id: wallets.id })
        .from(wallets)
        .where(eq(wallets.user_id, request.user_id))
        .limit(1)

      if (wallet) {
        await tx.insert(transactions).values({
          wallet_id: wallet.id,
          type: 'withdrawal',
          status: 'completed',
          amount_dzd: -request.amount_dzd,
          description: `سحب مُسدَّد — رقم الإثبات: ${data.transactionRef}`,
          created_at: now,
        })
      }

      paidUserId = request.user_id
      paidAmount = request.amount_dzd
    })

    // إشعار المستخدم بإتمام الدفع (best-effort)
    await notify({
      userId: paidUserId,
      type: 'withdrawal_update',
      title: 'تم دفع طلب السحب',
      body: `تم تحويل ${paidAmount.toLocaleString('ar-DZ')} د.ج إلى حسابك`,
    })

    return { success: true }
  })

export const rejectWithdrawal = createServerFn({ method: 'POST' })
  .validator(z.object({ withdrawalId: z.string().uuid() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()

    let rejUserId = ''
    let rejAmount = 0

    await db.transaction(async (tx) => {
      // قفل الصف لمنع الاسترجاع المزدوج للرصيد
      const [request] = await tx
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, data.withdrawalId))
        .for('update')
        .limit(1)

      if (!request) throw new Error('الطلب غير موجود')
      if (request.status === 'paid') throw new Error('لا يمكن رفض طلب مدفوع')
      if (request.status === 'rejected')
        throw new Error('هذا الطلب مرفوض مسبقاً')

      await tx
        .update(withdrawalRequests)
        .set({ status: 'rejected', processed_at: new Date() })
        .where(eq(withdrawalRequests.id, data.withdrawalId))

      // إرجاع المبلغ المخصوم إلى الرصيد القابل للسحب
      await tx
        .update(wallets)
        .set({
          available_balance_dzd: sql`${wallets.available_balance_dzd} + ${request.amount_dzd}`,
        })
        .where(eq(wallets.user_id, request.user_id))

      rejUserId = request.user_id
      rejAmount = request.amount_dzd
    })

    // إشعار المستخدم برفض السحب وإرجاع المبلغ (best-effort)
    await notify({
      userId: rejUserId,
      type: 'withdrawal_update',
      title: 'رُفض طلب السحب',
      body: `أُعيد مبلغ ${rejAmount.toLocaleString('ar-DZ')} د.ج إلى رصيدك المتاح`,
    })

    return { success: true }
  })

// ============================================================
// APPROVE WITHDRAWAL  (pending → approved)
// خطوة مراجعة Super Admin قبل الدفع الفعلي
// ============================================================

export const approveWithdrawal = createServerFn({ method: 'POST' })
  .validator(z.object({ withdrawalId: z.string().uuid() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()

    await db.transaction(async (tx) => {
      const [request] = await tx
        .select({
          id: withdrawalRequests.id,
          status: withdrawalRequests.status,
        })
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, data.withdrawalId))
        .for('update')
        .limit(1)

      if (!request) throw new Error('الطلب غير موجود')
      if (request.status !== 'pending')
        throw new Error('لا يمكن الموافقة إلا على طلب قيد الانتظار')

      await tx
        .update(withdrawalRequests)
        .set({ status: 'approved' })
        .where(eq(withdrawalRequests.id, data.withdrawalId))
    })

    return { success: true }
  })

// ============================================================
// GET WITHDRAWAL SOURCE  (كيف ربح المستخدم هذا الرصيد)
// يُرجع معاملات الأرباح (عمولة المسوّق / أرباح التاجر) مع المنتج والولاية
// ============================================================

export const getWithdrawalSource = createServerFn({ method: 'GET' })
  .validator((input: unknown) =>
    z.object({ withdrawalId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<EarningSourceItem[]> => {
    await requireSuperAdmin()

    const [req] = await db
      .select({ userId: withdrawalRequests.user_id, role: users.role })
      .from(withdrawalRequests)
      .innerJoin(users, eq(withdrawalRequests.user_id, users.id))
      .where(eq(withdrawalRequests.id, data.withdrawalId))
      .limit(1)

    if (!req) throw new Error('الطلب غير موجود')

    const [wallet] = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.user_id, req.userId))
      .limit(1)

    if (!wallet) return []

    const earningType: 'commission' | 'merchant_earning' =
      req.role === 'merchant' ? 'merchant_earning' : 'commission'

    const rows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount_dzd,
        status: transactions.status,
        date: transactions.created_at,
        productName: products.name,
        wilaya: orders.customer_wilaya,
      })
      .from(transactions)
      .leftJoin(orders, eq(transactions.order_id, orders.id))
      .leftJoin(products, eq(orders.product_id, products.id))
      .where(
        and(
          eq(transactions.wallet_id, wallet.id),
          eq(transactions.type, earningType),
        ),
      )
      .orderBy(desc(transactions.created_at))
      .limit(100)

    return rows.map((r) => ({
      id: r.id,
      productName: r.productName ?? '—',
      wilaya: r.wilaya ?? null,
      amount: r.amount,
      status: r.status === 'completed' ? 'released' : 'held',
      date: r.date.toISOString(),
    }))
  })
