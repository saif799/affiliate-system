// merchant/orders/-server/orders.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  merchantProfiles,
  orders,
  orderStatusHistory,
  products,
  deliveryAccounts,
} from '#/server/db/schema'
import { and, eq, sql, desc, notInArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { getEcotrackClient } from '#/server/services/ecotrack.service'
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

    // التاجر يرى فقط الطلبيات التي أكّدها المسوّق (confirmed فما فوق)
    // الطلبيات pending قيد قرار المسوّق، والملغاة/المتنازَع عليها مخفية
    const visible = and(
      eq(orders.merchant_id, profileId),
      notInArray(orders.status, ['pending', 'cancelled', 'disputed']),
    )

    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.created_at,
        productName: products.name,
        customerName: orders.customer_name,
        customerPhone: orders.customer_phone,
        wilaya: orders.customer_wilaya,
        commune: orders.customer_commune,
        address: orders.customer_address,
        note: orders.customer_note,
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
      commune: r.commune ?? undefined,
      address: r.address ?? undefined,
      note: r.note ?? undefined,
      quantity: r.quantity,
      totalPrice: r.unitAffiliate * r.quantity,
      merchantEarnings: Math.max(0, r.unitMerchant * r.quantity - r.feeMerchant),
      status: (STATUS_MAP[r.status as DbOrderStatus] ?? 'pending'),
      dbStatus: r.status as DbOrderStatus,
      trackingNumber: r.trackingNumber ?? undefined,
    }))

    const [counts] = await db
      .select({
        all: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'confirmed')`,
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
// SHIP ORDER — ينشئ الشحنة في ECOTRACK بضغطة واحدة (بلا إدخال يدوي)
//
// التاجر يملك إجراءً واحداً: شحن الطلبية المؤكَّدة (confirmed → shipped).
// عند الشحن نُنشئ الطلبية فعليّاً لدى شركة التوصيل (create/order) ونخزّن رقم
// التتبّع العائد منها. ما بعد الشحن (at_wilaya/delivered/returned) مصدره
// مزامنة ECOTRACK (cron) — لا يتحكّم به التاجر.
// ============================================================

// حساب التوصيل الافتراضي المُفعَّل (إن وُجد) — وإلّا نعتمد على API_DHD من البيئة
async function getDefaultDeliveryAccountId(): Promise<string | undefined> {
  const [acct] = await db
    .select({ id: deliveryAccounts.id })
    .from(deliveryAccounts)
    .where(
      and(
        eq(deliveryAccounts.provider, 'ecotrack'),
        eq(deliveryAccounts.is_default, true),
        eq(deliveryAccounts.is_active, true),
        isNull(deliveryAccounts.deleted_at),
      ),
    )
    .limit(1)
  return acct?.id
}

const ShipSchema = z.object({ orderId: z.string().uuid() })

export const shipOrder = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => ShipSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; tracking: string }> => {
    const { profileId } = await requireMerchant()

    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        customerName: orders.customer_name,
        customerPhone: orders.customer_phone,
        wilaya: orders.customer_wilaya,
        wilayaCode: orders.customer_wilaya_code,
        commune: orders.customer_commune,
        address: orders.customer_address,
        note: orders.customer_note,
        qty: orders.quantity,
        affiliatePrice: orders.unit_affiliate_price_dzd,
        productName: products.name,
        existingTracking: orders.tracking_number,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(and(eq(orders.id, data.orderId), eq(orders.merchant_id, profileId)))
      .limit(1)

    if (!order) throw new Error('الطلبية غير موجودة')
    if (order.status !== 'confirmed') throw new Error('لا يمكن شحن إلا طلبية مؤكَّدة')
    if (!order.wilayaCode || !order.commune) {
      throw new Error(
        'بيانات التوصيل ناقصة (الولاية/البلدية) — هذه طلبية قديمة؛ أعد إنشاءها باختيار منطقة صالحة',
      )
    }

    const accountId = await getDefaultDeliveryAccountId()
    let client
    try {
      client = await getEcotrackClient(accountId)
    } catch {
      throw new Error('لا يوجد حساب توصيل مُفعَّل — أضِف مفتاح ECOTRACK من الإعدادات')
    }

    // مبلغ COD الذي يدفعه الزبون = سعر بيع المسوّق × الكمية
    const montant = order.affiliatePrice * order.qty

    const res = await client.createOrder({
      nom_client: order.customerName,
      telephone: order.customerPhone,
      adresse: order.address?.trim() || `${order.commune}، ${order.wilaya}`,
      commune: order.commune,
      code_wilaya: order.wilayaCode,
      montant,
      produit: order.productName,
      remarque: order.note ?? undefined,
      quantite: order.qty,
      type: 1, // توصيل
      stop_desk: 0, // منزلي
    })

    const tracking = res.tracking
    if (!tracking) throw new Error('لم تُرجِع شركة التوصيل رقم تتبّع — حاول مجدداً')

    const now = new Date()
    await db
      .update(orders)
      .set({
        status: 'shipped',
        shipped_at: now,
        tracking_number: tracking,
        ecotrack_account_id: accountId ?? null,
        delivery_status: 'pending',
      })
      .where(eq(orders.id, order.id))

    await db.insert(orderStatusHistory).values({
      order_id: order.id,
      from_status: 'confirmed',
      to_status: 'shipped',
      occurred_at: now,
      source: 'merchant',
    })

    return { success: true, tracking }
  })
