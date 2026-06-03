// ============================================================
// src/server/settlement.ts
//
// التسوية المالية — تُستدعى عند تأكيد تسليم الطلبية (delivered)
// تُنشئ transactions للمسوّق والتاجر وتُحدّث أرصدة المحافظ
//
// نموذج الرسوم: رسوم ثابتة لكل طلب، تُؤخذ من الطرفين
//   commission       = (سعر المسوّق - سعر التاجر) × الكمية - رسوم المنصة من المسوّق
//   merchant_earning = سعر التاجر × الكمية - رسوم المنصة من التاجر
// ============================================================

import { db } from '#/server/db'
import {
  orders,
  wallets,
  transactions,
  affiliateProfiles,
  merchantProfiles,
} from '#/server/db/schema'
import { eq, sql } from 'drizzle-orm'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

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

  const [created] = await tx
    .insert(wallets)
    .values({ user_id: userId })
    .returning({ id: wallets.id })

  return created
}

// ────────────────────────────────────────────────────────────
// التسوية داخل transaction قائمة (للاستخدام ضمن عملية أكبر)
//
// - آمنة للتكرار (idempotent) عبر فحص settled_at
// - تفترض أن المستدعي قد ضبط الحالة = delivered ضمن نفس الـ tx
// ────────────────────────────────────────────────────────────

export async function settleOrderTx(tx: Tx, orderId: string): Promise<void> {
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

  // ── حساب المبالغ (per-order) ───────────────────────────────
  const commission = order.affiliateUserId
    ? Math.max(
        0,
        (order.affiliatePrice - order.merchantPrice) * order.quantity - order.feeAffiliate,
      )
    : 0
  const merchantEarning = Math.max(
    0,
    order.merchantPrice * order.quantity - order.feeMerchant,
  )
  const now = new Date()

  // ── عمولة المسوّق ──────────────────────────────────────────
  if (commission > 0 && order.affiliateUserId) {
    const affiliateWallet = await getOrCreateWallet(tx, order.affiliateUserId)

    await tx.insert(transactions).values({
      wallet_id:   affiliateWallet.id,
      order_id:    orderId,
      type:        'commission',
      status:      'completed',
      amount_dzd:  commission,
      description: 'عمولة طلبية مُسلَّمة',
      created_at:  now,
    })

    await tx
      .update(wallets)
      .set({ available_balance_dzd: sql`${wallets.available_balance_dzd} + ${commission}` })
      .where(eq(wallets.id, affiliateWallet.id))
  }

  // ── أرباح التاجر ───────────────────────────────────────────
  if (merchantEarning > 0) {
    const merchantWallet = await getOrCreateWallet(tx, order.merchantUserId)

    await tx.insert(transactions).values({
      wallet_id:   merchantWallet.id,
      order_id:    orderId,
      type:        'merchant_earning',
      status:      'completed',
      amount_dzd:  merchantEarning,
      description: 'أرباح طلبية مُسلَّمة',
      created_at:  now,
    })

    await tx
      .update(wallets)
      .set({ available_balance_dzd: sql`${wallets.available_balance_dzd} + ${merchantEarning}` })
      .where(eq(wallets.id, merchantWallet.id))
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
