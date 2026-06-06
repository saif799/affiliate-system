// affiliate/orders/-server/orders.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { affiliateProfiles, merchantProfiles, orders, orderStatusHistory, products, settings } from '#/server/db/schema'
import { and, eq, sql, desc, notInArray, isNull, inArray } from 'drizzle-orm'
import { notify } from '#/server/notify'
import { getEcotrackClient } from '#/server/services/ecotrack.service'
import { z } from 'zod'
import type {
  OrdersPageData,
  AffiliateOrder,
  OrderStatus,
} from '../-orders.types'

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
const round1 = (v: number) => Math.round(v * 10) / 10
const ref = (id: string, prefix: string) =>
  `${prefix}-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

// رسوم المنصة الثابتة لكل طلب (من الإعدادات) — تُؤخذ من الطرفين
async function getPlatformFees(): Promise<{ merchant: number; affiliate: number }> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, ['platform_fee_merchant', 'platform_fee_affiliate']))

  const kv = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    merchant: kv.platform_fee_merchant !== undefined ? Number(kv.platform_fee_merchant) : 50,
    affiliate: kv.platform_fee_affiliate !== undefined ? Number(kv.platform_fee_affiliate) : 50,
  }
}

// DB status (8 حالات) → حالة واجهة المسوّق (4 حالات)
const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  confirmed: 'pending',
  shipped: 'shipping',
  at_wilaya: 'shipping',
  delivered: 'delivered',
  returned: 'returned',
}

// ============================================================
// GET ORDERS
// ============================================================

export const getAffiliateOrders = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OrdersPageData> => {
    const { profileId } = await requireAffiliate()

    const visible = and(
      eq(orders.affiliate_id, profileId),
      notInArray(orders.status, ['cancelled', 'disputed']),
    )

    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.created_at,
        productName: products.name,
        sku: products.sku,
        merchantName: merchantProfiles.business_name,
        customerName: orders.customer_name,
        customerPhone: orders.customer_phone,
        wilaya: orders.customer_wilaya,
        quantity: orders.quantity,
        affiliatePrice: orders.unit_affiliate_price_dzd,
        merchantPrice: orders.unit_merchant_price_dzd,
        platformFee: orders.platform_fee_affiliate_dzd,
        status: orders.status,
        trackingNumber: orders.tracking_number,
        confirmedAt: orders.confirmed_at,
        shippedAt: orders.shipped_at,
        atWilayaAt: orders.at_wilaya_at,
        deliveredAt: orders.delivered_at,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .where(visible)
      .orderBy(desc(orders.created_at))

    const iso = (d: Date | null) => (d ? d.toISOString() : null)

    const ordersList: AffiliateOrder[] = rows.map((r) => ({
      id: ref(r.id, 'ORD'),
      rawId: r.id,
      date: r.createdAt.toISOString().slice(0, 10),
      product: r.productName,
      productThumb: '📦',
      sku: r.sku ?? '—',
      merchantName: r.merchantName,
      customer: r.customerName,
      phone: r.customerPhone,
      wilaya: r.wilaya,
      quantity: r.quantity,
      basePrice: r.merchantPrice,
      price: r.affiliatePrice * r.quantity,
      commission: Math.max(
        0,
        (r.affiliatePrice - r.merchantPrice) * r.quantity - r.platformFee,
      ),
      status: STATUS_MAP[r.status] ?? 'pending',
      dbStatus: r.status,
      needsAction: r.status === 'pending',
      trackingNumber: r.trackingNumber,
      createdAt: r.createdAt.toISOString(),
      confirmedAt: iso(r.confirmedAt),
      shippedAt: iso(r.shippedAt),
      atWilayaAt: iso(r.atWilayaAt),
      deliveredAt: iso(r.deliveredAt),
    }))

    // ── stats ────────────────────────────────────────────────
    const [statsRow] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        inShipping: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('shipped', 'at_wilaya'))`,
        earnedComm: sql<number>`COALESCE(SUM(GREATEST((${orders.unit_affiliate_price_dzd} - ${orders.unit_merchant_price_dzd}) * ${orders.quantity} - ${orders.platform_fee_affiliate_dzd}, 0)) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
      })
      .from(orders)
      .where(visible)

    const delivered = n(statsRow.delivered)
    const returned = n(statsRow.returned)
    const finalized = delivered + returned

    const stats = {
      total: n(statsRow.total),
      earnedComm: n(statsRow.earnedComm),
      inShipping: n(statsRow.inShipping),
      deliveryRate: finalized > 0 ? round1((delivered / finalized) * 100) : 0,
    }

    return { orders: ordersList, stats }
  },
)

// ============================================================
// ADD MANUAL LEAD (إنشاء طلبية حقيقية)
// ============================================================

const AddLeadSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(9).max(20),
  // منطقة التوصيل تُختار من قوائم ECOTRACK (ولاية بالرمز + بلدية مطابقة)
  wilayaCode: z.number().int().min(1).max(58),
  wilayaName: z.string().trim().min(1),
  commune: z.string().trim().min(1),
  address: z.string().trim().min(1),
  salePrice: z.number().int().positive(),
  notes: z.string().trim().max(300).optional(),
})

export const addLeadManual = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => AddLeadSchema.parse(input))
  .handler(async ({ data }) => {
    const { profileId } = await requireAffiliate()

    const [product] = await db
      .select({
        id: products.id,
        merchantId: products.merchant_id,
        merchantPrice: products.merchant_price_dzd,
        isActive: products.is_active,
        stockQty: products.stock_qty,
      })
      .from(products)
      .where(and(eq(products.id, data.productId), isNull(products.deleted_at)))
      .limit(1)

    if (!product) throw new Error('المنتج غير موجود')
    if (!product.isActive || product.stockQty <= 0)
      throw new Error('المنتج غير متاح حالياً')
    if (data.salePrice < product.merchantPrice)
      throw new Error('سعر البيع لا يمكن أن يكون أقل من سعر الجملة')

    const fees = await getPlatformFees()

    await db.insert(orders).values({
      product_id: product.id,
      affiliate_id: profileId,
      merchant_id: product.merchantId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_wilaya: data.wilayaName,
      customer_wilaya_code: data.wilayaCode,
      customer_commune: data.commune,
      customer_address: data.address,
      customer_note: data.notes ?? null,
      quantity: 1,
      unit_affiliate_price_dzd: data.salePrice,
      unit_merchant_price_dzd: product.merchantPrice,
      platform_fee_merchant_dzd: fees.merchant,
      platform_fee_affiliate_dzd: fees.affiliate,
      platform_fee_dzd: fees.merchant + fees.affiliate,
      status: 'pending',
    })

    return { success: true }
  })

// ============================================================
// CONFIRM LEAD (المسوّق يؤكّد → تذهب للتاجر + يُنقَص المخزون)
// ============================================================

const OrderIdSchema = z.object({ orderId: z.string().uuid() })

export const confirmLead = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => OrderIdSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { session, profileId } = await requireAffiliate()

    const info = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          id: orders.id,
          status: orders.status,
          productId: orders.product_id,
          quantity: orders.quantity,
        })
        .from(orders)
        .where(and(eq(orders.id, data.orderId), eq(orders.affiliate_id, profileId)))
        .limit(1)

      if (!order) throw new Error('الطلبية غير موجودة')
      if (order.status !== 'pending')
        throw new Error('لا يمكن تأكيد هذه الطلبية في حالتها الحالية')

      // اقفل المنتج وتحقّق من توفّر المخزون قبل الخصم
      const [product] = await tx
        .select({
          id: products.id,
          stock: products.stock_qty,
          merchantId: products.merchant_id,
          name: products.name,
          threshold: products.low_stock_threshold,
        })
        .from(products)
        .where(eq(products.id, order.productId))
        .for('update')
        .limit(1)

      if (!product) throw new Error('المنتج غير موجود')
      if (product.stock < order.quantity)
        throw new Error('المخزون غير كافٍ لتأكيد هذه الطلبية')

      const now = new Date()
      const newStock = product.stock - order.quantity

      await tx
        .update(products)
        .set({ stock_qty: newStock })
        .where(eq(products.id, product.id))

      await tx
        .update(orders)
        .set({ status: 'confirmed', confirmed_at: now })
        .where(eq(orders.id, order.id))

      await tx.insert(orderStatusHistory).values({
        order_id: order.id,
        from_status: 'pending',
        to_status: 'confirmed',
        occurred_at: now,
        source: 'affiliate',
      })

      return {
        merchantId: product.merchantId,
        productName: product.name,
        newStock,
        threshold: product.threshold,
      }
    })

    // ── إشعارات (best-effort بعد نجاح المعاملة) ──
    const [merchant] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, info.merchantId))
      .limit(1)

    if (merchant) {
      await notify({
        userId: merchant.userId,
        type: 'order_new',
        title: 'طلبية جديدة جاهزة للتجهيز',
        body: `طلبية مؤكَّدة على «${info.productName}» — جهّزها واشحنها`,
        link: '/merchant/orders',
      })

      // تنبيه قرب نفاد المخزون (للتاجر والمسوّق)
      if (info.newStock <= info.threshold) {
        await notify({
          userId: merchant.userId,
          type: 'low_stock',
          title: 'مخزون منخفض',
          body: `«${info.productName}» — بقي ${info.newStock} قطعة فقط`,
          link: '/merchant/products',
        })
        await notify({
          userId: session.user.id,
          type: 'low_stock',
          title: 'المنتج على وشك النفاد',
          body: `«${info.productName}» — بقي ${info.newStock} قطعة، سارِع قبل النفاد`,
          link: '/affiliate/marketplace',
        })
      }
    }

    return { success: true }
  })

// ============================================================
// REJECT LEAD (المسوّق يرفض → cancelled، لا تذهب للتاجر)
// ============================================================

export const rejectLead = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => OrderIdSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { profileId } = await requireAffiliate()

    const [order] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, data.orderId), eq(orders.affiliate_id, profileId)))
      .limit(1)

    if (!order) throw new Error('الطلبية غير موجودة')
    if (order.status !== 'pending')
      throw new Error('لا يمكن رفض هذه الطلبية في حالتها الحالية')

    const now = new Date()

    // المخزون لم يُنقَص بعد (يُنقَص عند التأكيد فقط) → لا حاجة لإرجاعه
    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, order.id))

    await db.insert(orderStatusHistory).values({
      order_id: order.id,
      from_status: 'pending',
      to_status: 'cancelled',
      occurred_at: now,
      source: 'affiliate',
    })

    return { success: true }
  })

// ============================================================
// مناطق التوصيل (من ECOTRACK) — لملء نموذج الطلبية اليدوية بقيم صالحة
// ============================================================

export const getDeliveryZones = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ code: number; name: string }[]> => {
    await requireAffiliate()
    const client = await getEcotrackClient()
    const wilayas = await client.getWilayas()
    return wilayas
      .map((w) => ({ code: w.wilaya_id, name: w.wilaya_name }))
      .sort((a, b) => a.code - b.code)
  },
)

export const getDeliveryCommunes = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) =>
    z.object({ wilayaCode: z.number().int().min(1).max(58) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ name: string; hasStopDesk: boolean }[]> => {
    await requireAffiliate()
    const client = await getEcotrackClient()
    const communes = await client.getCommunes(data.wilayaCode)
    return communes.map((c) => ({ name: c.nom, hasStopDesk: c.has_stop_desk === 1 }))
  })
