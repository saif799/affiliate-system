// ============================================================
// src/server/settlement.ts
//
// التسوية المالية — تُستدعى عند تأكيد تسليم الطلبية (delivered)
// تُنشئ transactions للمسوّق والتاجر وتُحدّث أرصدة المحافظ
//
// نموذج الرسوم: رسوم ثابتة لكل طلب، تُؤخذ من الطرفين
//   commission       = (سعر المسوّق - سعر التاجر) × الكمية - رسوم المنصة من المسوّق
//   merchant_earning = سعر التاجر × الكمية - رسوم المنصة من التاجر
//
// نموذج الحجز (clearing): عند التسليم تُضاف الأرباح إلى pending_balance_dzd
// (المعاملة بحالة 'pending')، ثم بعد HOLD_HOURS ساعة تُحرَّر تلقائياً إلى
// available_balance_dzd (المعاملة → 'completed'). السحب يعتمد على available فقط.
// ============================================================

import { db } from '#/server/db'
import {
  orders,
  orderStatusHistory,
  wallets,
  transactions,
  affiliateProfiles,
  merchantProfiles,
  users,
  settings,
} from '#/server/db/schema'
import { eq, sql, and, lte, inArray } from 'drizzle-orm'
import { computeSettlement } from '#/server/settlement-math'

// حساب المنصة الثابت (دور system) — يملك سجلّ رسوم المنصة
const SYSTEM_USER_ID = 'system'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// مدة حجز الأرباح الافتراضية (أيام) قبل أن تصبح قابلة للسحب — تُضبط من إعدادات Super Admin
export const DEFAULT_CLEARANCE_DAYS = 2

/** مدّة الحجز بالأيام من الإعدادات (clearance_days) */
async function getClearanceDays(): Promise<number> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'clearance_days'))
    .limit(1)
  const n = row ? Number(row.value) : DEFAULT_CLEARANCE_DAYS
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_CLEARANCE_DAYS
}

// ────────────────────────────────────────────────────────────
// جلب أو إنشاء محفظة لمستخدم (الـ hook قد لا ينشئها)
// ────────────────────────────────────────────────────────────

async function getOrCreateWallet(tx: Tx, userId: string): Promise<{ id: string }> {
  const [existing] = await tx
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.user_id, userId))
    .limit(1)

  if (existing) return existing

  // إنشاء آمن للتزامن: لو أنشأت معاملةٌ أخرى المحفظة في نفس اللحظة،
  // لا نفشل بانتهاك القيد الفريد — نتجاهل التعارض ثم نُعيد القراءة.
  const [created] = await tx
    .insert(wallets)
    .values({ user_id: userId })
    .onConflictDoNothing()
    .returning({ id: wallets.id })

  if (created) return created

  const [w] = await tx
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.user_id, userId))
    .limit(1)

  if (!w) throw new Error(`getOrCreateWallet: تعذّر جلب/إنشاء المحفظة — ${userId}`)
  return w
}

// محفظة حساب المنصة (تُنشأ تلقائياً مرّة واحدة عند أول تسوية)
async function getSystemWallet(tx: Tx): Promise<{ id: string }> {
  await tx
    .insert(users)
    .values({
      id: SYSTEM_USER_ID,
      name: 'النظام',
      email: 'system@platform.local',
      emailVerified: true,
      role: 'system',
      status: 'active',
    })
    .onConflictDoNothing()

  return getOrCreateWallet(tx, SYSTEM_USER_ID)
}

// ────────────────────────────────────────────────────────────
// التسوية داخل transaction قائمة (للاستخدام ضمن عملية أكبر)
//
// - آمنة للتكرار (idempotent) عبر فحص settled_at
// - تفترض أن المستدعي قد ضبط الحالة = delivered ضمن نفس الـ tx
// ────────────────────────────────────────────────────────────

export async function settleOrderTx(tx: Tx, orderId: string): Promise<void> {
  // قفل صف الطلبية أولاً → يمنع التسوية المزدوجة عند وجود مُشغّلين متزامنين
  // (مثلاً التاجر + webhook شركة التوصيل). الثاني ينتظر ثم يجد settled_at ممتلئاً.
  await tx
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update')
    .limit(1)

  const [order] = await tx
    .select({
      id:              orders.id,
      affiliateUserId: affiliateProfiles.user_id,
      merchantUserId:  merchantProfiles.user_id,
      affiliatePrice:  orders.unit_affiliate_price_dzd,
      merchantPrice:   orders.unit_merchant_price_dzd,
      feeMerchant:     orders.platform_fee_merchant_dzd,
      feeAffiliate:    orders.platform_fee_affiliate_dzd,
      quantity:        orders.quantity,
      settledAt:       orders.settled_at,
    })
    .from(orders)
    .leftJoin(affiliateProfiles, eq(orders.affiliate_id, affiliateProfiles.id))
    .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) throw new Error(`settleOrder: طلبية غير موجودة — ${orderId}`)
  if (order.settledAt) return // سُوّيت مسبقاً → لا تكرار

  // ── حساب المبالغ (per-order) — عبر الدالة النقية القابلة للاختبار ──
  const { commission, merchantEarning } = computeSettlement({
    hasAffiliate: order.affiliateUserId != null,
    affiliatePrice: order.affiliatePrice,
    merchantPrice: order.merchantPrice,
    feeAffiliate: order.feeAffiliate,
    feeMerchant: order.feeMerchant,
    quantity: order.quantity,
  })
  const now = new Date()

  // ── عمولة المسوّق ──────────────────────────────────────────
  if (commission > 0 && order.affiliateUserId) {
    const affiliateWallet = await getOrCreateWallet(tx, order.affiliateUserId)

    await tx.insert(transactions).values({
      wallet_id:   affiliateWallet.id,
      order_id:    orderId,
      type:        'commission',
      status:      'pending', // قيد الحجز — يُحرَّر بعد HOLD_HOURS
      amount_dzd:  commission,
      description: 'عمولة طلبية مُسلَّمة',
      created_at:  now,
    })

    await tx
      .update(wallets)
      .set({ pending_balance_dzd: sql`${wallets.pending_balance_dzd} + ${commission}` })
      .where(eq(wallets.id, affiliateWallet.id))
  }

  // ── أرباح التاجر ───────────────────────────────────────────
  if (merchantEarning > 0) {
    const merchantWallet = await getOrCreateWallet(tx, order.merchantUserId)

    await tx.insert(transactions).values({
      wallet_id:   merchantWallet.id,
      order_id:    orderId,
      type:        'merchant_earning',
      status:      'pending', // قيد الحجز — يُحرَّر بعد HOLD_HOURS
      amount_dzd:  merchantEarning,
      description: 'أرباح طلبية مُسلَّمة',
      created_at:  now,
    })

    await tx
      .update(wallets)
      .set({ pending_balance_dzd: sql`${wallets.pending_balance_dzd} + ${merchantEarning}` })
      .where(eq(wallets.id, merchantWallet.id))
  }

  // ── رسوم المنصة → محفظة النظام (سجلّ مالي) ─────────────────
  const platformFee = order.feeMerchant + order.feeAffiliate
  if (platformFee > 0) {
    const systemWallet = await getSystemWallet(tx)

    await tx.insert(transactions).values({
      wallet_id:   systemWallet.id,
      order_id:    orderId,
      type:        'platform_fee',
      status:      'completed',
      amount_dzd:  platformFee,
      description: 'رسوم المنصة من طلبية مُسلَّمة',
      created_at:  now,
    })

    await tx
      .update(wallets)
      .set({ available_balance_dzd: sql`${wallets.available_balance_dzd} + ${platformFee}` })
      .where(eq(wallets.id, systemWallet.id))
  }

  // ── تسجيل وقت التسوية ──────────────────────────────────────
  await tx.update(orders).set({ settled_at: now }).where(eq(orders.id, orderId))
}

// ────────────────────────────────────────────────────────────
// تسوية مستقلة (تفتح transaction خاصة بها)
// ────────────────────────────────────────────────────────────

export async function settleOrder(orderId: string): Promise<void> {
  await db.transaction((tx) => settleOrderTx(tx, orderId))
}

// ────────────────────────────────────────────────────────────
// إعادة حساب نسبة الرفض للمسوّق
//   refusal_rate = المُرتجَع / (المُسلَّم + المُرتجَع) × 100
//
// يجب استدعاؤها من webhook شركة التوصيل عند كلٍّ من delivered و returned،
// لأن كليهما يُغيّر المقام. تُستدعى داخل نفس tx تحديث الحالة.
// ────────────────────────────────────────────────────────────

export async function recomputeRefusalRateTx(
  tx: Tx,
  affiliateId: string,
): Promise<void> {
  await tx
    .update(affiliateProfiles)
    .set({
      refusal_rate: sql`(
        SELECT ROUND(
          COUNT(*) FILTER (WHERE ${orders.status} = 'returned')::numeric
          / NULLIF(COUNT(*) FILTER (WHERE ${orders.status} IN ('delivered', 'returned')), 0) * 100
        , 2)
        FROM ${orders}
        WHERE ${orders.affiliate_id} = ${affiliateId}
      )`,
    })
    .where(eq(affiliateProfiles.id, affiliateId))
}

// ────────────────────────────────────────────────────────────
// النزاع (disputed): تجميد طلبية متنازَع عليها ثم حلّها
//
// الاستخدام: عند تعارض بيانات شركة التوصيل مع المتوقَّع (طرد ضائع/عالق،
// أو الزبون ينكر الاستلام). تُجمَّد فتُستثنى من التدفّق العادي (الاستعلامات
// تستبعد disputed أصلاً) حتى يحلّها الأدمن.
//
// flagOrderDisputedTx → يستدعيها webhook التوصيل عند التعارض.
// resolveDisputeTx    → يستدعيها زر الأدمن (delivered/returned/cancelled).
// ────────────────────────────────────────────────────────────

const FROZEN_STATUSES = ['delivered', 'cancelled'] as const

export async function flagOrderDisputedTx(
  tx: Tx,
  orderId: string,
  note?: string,
): Promise<void> {
  const [order] = await tx
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update')
    .limit(1)

  if (!order) throw new Error(`flagDispute: طلبية غير موجودة — ${orderId}`)
  if (order.status === 'disputed') return // idempotent
  if ((FROZEN_STATUSES as readonly string[]).includes(order.status)) {
    throw new Error('لا يمكن فتح نزاع على طلبية مُسلَّمة أو ملغاة')
  }

  const now = new Date()
  await tx.update(orders).set({ status: 'disputed' }).where(eq(orders.id, orderId))
  await tx.insert(orderStatusHistory).values({
    order_id: orderId,
    from_status: order.status,
    to_status: 'disputed',
    occurred_at: now,
    source: 'system',
    note: note ?? null,
  })
}

export type DisputeResolution = 'delivered' | 'returned' | 'cancelled'

export async function resolveDisputeTx(
  tx: Tx,
  orderId: string,
  resolution: DisputeResolution,
  note?: string,
): Promise<void> {
  const [order] = await tx
    .select({ id: orders.id, status: orders.status, affiliateId: orders.affiliate_id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update')
    .limit(1)

  if (!order) throw new Error(`resolveDispute: طلبية غير موجودة — ${orderId}`)
  if (order.status !== 'disputed') throw new Error('الطلبية ليست في حالة نزاع')

  const now = new Date()
  const patch: Record<string, unknown> = { status: resolution }
  if (resolution === 'delivered') patch.delivered_at = now

  await tx.update(orders).set(patch).where(eq(orders.id, orderId))
  await tx.insert(orderStatusHistory).values({
    order_id: orderId,
    from_status: 'disputed',
    to_status: resolution,
    occurred_at: now,
    source: 'admin',
    note: note ?? null,
  })

  // أثر مالي/إحصائي حسب الحلّ
  if (resolution === 'delivered') {
    await settleOrderTx(tx, orderId)
    if (order.affiliateId) await recomputeRefusalRateTx(tx, order.affiliateId)
  } else if (resolution === 'returned') {
    if (order.affiliateId) await recomputeRefusalRateTx(tx, order.affiliateId)
  }
  // cancelled: لا تسوية ولا أثر على نسبة الرفض
}

/** غلاف مستقل لفتح نزاع (يفتح transaction خاصة) — للاستدعاء من زر الأدمن أو webhook */
export async function flagOrderDisputed(
  orderId: string,
  note?: string,
): Promise<void> {
  await db.transaction((tx) => flagOrderDisputedTx(tx, orderId, note))
}

/** غلاف مستقل لحلّ النزاع (يفتح transaction خاصة) — للاستدعاء من زر الأدمن */
export async function resolveDispute(
  orderId: string,
  resolution: DisputeResolution,
  note?: string,
): Promise<void> {
  await db.transaction((tx) => resolveDisputeTx(tx, orderId, resolution, note))
}

// ────────────────────────────────────────────────────────────
// تحرير الأرباح المنتهية فترة حجزها (pending → available)
//
// مدّة الحجز قابلة للضبط من إعدادات Super Admin (clearance_days).
// تُستدعى كسولاً (عند فتح المحفظة/قبل السحب) ودورياً (cron) لضمان
// التحرير حتى لو لم يفتح المستخدم حسابه. آمنة للتزامن عبر قفل المحفظة.
// ────────────────────────────────────────────────────────────

export async function releaseMaturedFundsTx(
  tx: Tx,
  userId: string,
  cutoff: Date,
): Promise<void> {
  const [wallet] = await tx
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.user_id, userId))
    .for('update')
    .limit(1)

  if (!wallet) return

  // الأرباح المحجوزة (commission / merchant_earning) التي انقضت مدّتها
  const matured = await tx
    .select({ id: transactions.id, amount: transactions.amount_dzd })
    .from(transactions)
    .where(
      and(
        eq(transactions.wallet_id, wallet.id),
        eq(transactions.status, 'pending'),
        lte(transactions.created_at, cutoff),
      ),
    )

  if (matured.length === 0) return

  const total = matured.reduce((sum, t) => sum + t.amount, 0)

  await tx
    .update(transactions)
    .set({ status: 'completed' })
    .where(inArray(transactions.id, matured.map((t) => t.id)))

  await tx
    .update(wallets)
    .set({
      pending_balance_dzd: sql`GREATEST(${wallets.pending_balance_dzd} - ${total}, 0)`,
      available_balance_dzd: sql`${wallets.available_balance_dzd} + ${total}`,
    })
    .where(eq(wallets.id, wallet.id))
}

/** تحرير مستحقّات مستخدم واحد (يقرأ مدّة الحجز من الإعدادات) */
export async function releaseMaturedFunds(userId: string): Promise<void> {
  const days = await getClearanceDays()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  await db.transaction((tx) => releaseMaturedFundsTx(tx, userId, cutoff))
}

// ────────────────────────────────────────────────────────────
// كنس دوري (cron): تحرير مستحقّات كل المستخدمين دفعةً واحدة
// يُستدعى من مهمة مجدولة (مثلاً كل ساعة) فلا تبقى الأموال محجوزة
// إن لم يفتح المستخدم محفظته. آمن وقابل للتكرار (idempotent).
// ────────────────────────────────────────────────────────────

export async function releaseAllMaturedFunds(): Promise<{ wallets: number }> {
  const days = await getClearanceDays()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // المحافظ التي لديها أرباح محجوزة انقضت مدّتها فقط
  const candidates = await db
    .selectDistinct({ userId: wallets.user_id })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.wallet_id, wallets.id))
    .where(
      and(
        eq(transactions.status, 'pending'),
        lte(transactions.created_at, cutoff),
      ),
    )

  for (const c of candidates) {
    await db.transaction((tx) => releaseMaturedFundsTx(tx, c.userId, cutoff))
  }

  return { wallets: candidates.length }
}
