// merchant/orders/-server/orders.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { affiliateProfiles, merchantProfiles, orders, orderStatusHistory, products } from '#/server/db/schema'
import { and, eq, sql, desc, notInArray } from 'drizzle-orm'
import { z } from 'zod'
import { settleOrderTx } from '#/server/settlement'
import type {
  MerchantOrdersData,
  Order,
  OrderStatus,
  DbOrderStatus,
} from '../-orders.types'

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

const STATUS_MAP: Record<DbOrderStatus, OrderStatus | null> = {
  pending: 'pending',
  confirmed: 'pending',
  shipped: 'shipped',
  at_wilaya: 'shipped',
  delivered: 'delivered',
  returned: 'returned',
  cancelled: null,
  disputed: null,
}

const n = (v: unknown) => Number(v ?? 0)

// ============================================================
// GET ORDERS
// ============================================================

export const getMerchantOrders = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MerchantOrdersData> => {
    const { profileId } = await requireMerchant()

    const visible = and(
      eq(orders.merchant_id, profileId),
      notInArray(orders.status, ['cancelled', 'disputed']),
    )

    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.created_at,
        productName: products.name,
        customerName: orders.customer_name,
        customerPhone: orders.customer_phone,
        wilaya: orders.customer_wilaya,
        quantity: orders.quantity,
        unitAffiliate: orders.unit_affiliate_price_dzd,
        unitMerchant: orders.unit_merchant_price_dzd,
        feeMerchant: orders.platform_fee_merchant_dzd,
        status: orders.status,
        trackingNumber: orders.tracking_number,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(visible)
      .orderBy(desc(orders.created_at))

    const ordersList: Order[] = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString().slice(0, 10),
      product: { name: r.productName, variant: '' },
      customer: { name: r.customerName, phone: r.customerPhone },
      wilaya: r.wilaya,
      totalPrice: r.unitAffiliate * r.quantity,
      merchantEarnings: Math.max(0, r.unitMerchant * r.quantity - r.feeMerchant),
      status: (STATUS_MAP[r.status as DbOrderStatus] ?? 'pending') as OrderStatus,
      dbStatus: r.status as DbOrderStatus,
      trackingNumber: r.trackingNumber ?? undefined,
    }))

    const [counts] = await db
      .select({
        all: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('pending', 'confirmed'))`,
        shipped: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('shipped', 'at_wilaya'))`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
      })
      .from(orders)
      .where(visible)

    return {
      orders: ordersList,
      tabCounts: {
        all: n(counts.all),
        pending: n(counts.pending),
        shipped: n(counts.shipped),
        delivered: n(counts.delivered),
        returned: n(counts.returned),
      },
    }
  },
)

// ============================================================
// UPDATE ORDER STATUS
// ============================================================

const UpdateStatusSchema = z.object({
  orderId: z.string(),
  newStatus: z.enum(['confirmed', 'shipped', 'at_wilaya', 'delivered', 'returned']),
})

// الانتقالات المسموح بها للتاجر: الحالة الحالية → الحالة الجديدة
const ALLOWED_FROM: Record<string, DbOrderStatus[]> = {
  confirmed:  ['pending'],
  shipped:    ['confirmed'],
  at_wilaya:  ['shipped'],
  delivered:  ['at_wilaya', 'shipped'], // shipped → delivered للتوصيل المباشر
  returned:   ['shipped', 'at_wilaya', 'delivered'],
}

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => UpdateStatusSchema.parse(input))
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    const [order] = await db
      .select({ id: orders.id, status: orders.status, affiliateId: orders.affiliate_id })
      .from(orders)
      .where(and(eq(orders.id, data.orderId), eq(orders.merchant_id, profileId)))
      .limit(1)

    if (!order) throw new Error('الطلبية غير موجودة')

    const from = order.status as DbOrderStatus
    if (!ALLOWED_FROM[data.newStatus]?.includes(from)) {
      throw new Error('انتقال غير مسموح به للحالة المطلوبة')
    }

    const now = new Date()
    const patch: Record<string, unknown> = { status: data.newStatus }
    if (data.newStatus === 'confirmed')  patch.confirmed_at = now
    if (data.newStatus === 'shipped')    patch.shipped_at   = now
    if (data.newStatus === 'at_wilaya')  patch.at_wilaya_at = now
    if (data.newStatus === 'delivered')  patch.delivered_at = now

    const historyRow = {
      order_id:    data.orderId,
      from_status: from,
      to_status:   data.newStatus,
      occurred_at: now,
      source:      'merchant',
    }

    if (data.newStatus === 'delivered') {
      // تغيير الحالة + التسوية المالية في transaction واحدة (ذرّية)
      await db.transaction(async (tx) => {
        await tx.update(orders).set(patch).where(eq(orders.id, data.orderId))
        await tx.insert(orderStatusHistory).values(historyRow)
        await settleOrderTx(tx, data.orderId)
      })
    } else {
      await db.update(orders).set(patch).where(eq(orders.id, data.orderId))
      await db.insert(orderStatusHistory).values(historyRow)

      // تحديث نسبة الرفض للمسوّق عند الإرجاع (نسبة تراكمية على كل طلبياته)
      if (data.newStatus === 'returned' && order.affiliateId) {
        await db
          .update(affiliateProfiles)
          .set({
            refusal_rate: sql`(
              SELECT ROUND(
                COUNT(*) FILTER (WHERE ${orders.status} = 'returned')::numeric
                / NULLIF(COUNT(*), 0) * 100
              , 2)
              FROM ${orders}
              WHERE ${orders.affiliate_id} = ${order.affiliateId}
            )`,
          })
          .where(eq(affiliateProfiles.id, order.affiliateId))
      }
    }

    return { success: true }
  })
