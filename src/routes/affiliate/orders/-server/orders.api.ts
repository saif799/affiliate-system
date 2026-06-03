// affiliate/orders/-server/orders.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { affiliateProfiles, orders, products, settings } from '#/server/db/schema'
import { and, eq, sql, desc, notInArray, isNull, gt, inArray } from 'drizzle-orm'
import { z } from 'zod'
import type {
  OrdersPageData,
  AffiliateOrder,
  OrderStatus,
  LeadProduct,
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
        customerName: orders.customer_name,
        customerPhone: orders.customer_phone,
        wilaya: orders.customer_wilaya,
        quantity: orders.quantity,
        affiliatePrice: orders.unit_affiliate_price_dzd,
        merchantPrice: orders.unit_merchant_price_dzd,
        platformFee: orders.platform_fee_affiliate_dzd,
        status: orders.status,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(visible)
      .orderBy(desc(orders.created_at))

    const ordersList: AffiliateOrder[] = rows.map((r) => ({
      id: ref(r.id, 'ORD'),
      date: r.createdAt.toISOString().slice(0, 10),
      product: r.productName,
      productThumb: '📦',
      sku: r.sku ?? '—',
      customer: r.customerName,
      phone: r.customerPhone,
      wilaya: r.wilaya,
      price: r.affiliatePrice * r.quantity,
      commission: Math.max(
        0,
        (r.affiliatePrice - r.merchantPrice) * r.quantity - r.platformFee,
      ),
      status: STATUS_MAP[r.status] ?? 'pending',
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

    // ── products (للطلبية اليدوية: أي منتج نشط ومتوفر) ────────
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        basePrice: products.merchant_price_dzd,
      })
      .from(products)
      .where(
        and(
          eq(products.is_active, true),
          isNull(products.deleted_at),
          gt(products.stock_qty, 0),
        ),
      )
      .orderBy(products.name)

    const productList: LeadProduct[] = productRows.map((p) => ({
      id: p.id,
      name: p.name,
      basePrice: p.basePrice,
    }))

    return { orders: ordersList, stats, products: productList }
  },
)

// ============================================================
// ADD MANUAL LEAD (إنشاء طلبية حقيقية)
// ============================================================

const AddLeadSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  wilaya: z.string().min(1),
  city: z.string().optional(),
  salePrice: z.number().int().positive(),
  notes: z.string().optional(),
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
      customer_wilaya: data.wilaya,
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
