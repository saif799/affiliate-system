// src/routes/_dashboard/campaigns/-server/campaigns.api.ts
import { createServerFn } from '@tanstack/react-start'
import { db }             from '#/server/db'
import { getSession }     from '#/lib/session'
import { requireSuperAdmin } from '#/server/auth/guards'
import { notify }            from '#/server/notify'
import {
  products,
  merchantProfiles,
  users,
  orders,
} from '#/server/db/schema'
import { eq, and, isNull, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import type { ProductsData, Product, ProductStats } from '../-campaigns.types'
import { ORDER_STATUS, HIGH_RETURN_THRESHOLD }      from '../-campaigns.constants'


function getMonthRanges() {
  const now   = new Date()
  const year  = now.getUTCFullYear()
  const month = now.getUTCMonth()

  return {
    t0: new Date(Date.UTC(year, month - 1, 1)).toISOString(), 
    t1: new Date(Date.UTC(year, month,     1)).toISOString(), 
    t2: new Date(Date.UTC(year, month + 1, 1)).toISOString(), 
  }
}

function growthRate(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0
  return Math.round(((current - previous) / previous) * 100)
}


function buildOrdersAggCte() {
  return db.$with('orders_agg').as(
    db.select({
      productId:      orders.product_id,
      totalOrders:    sql<number>`COUNT(*)`.as('total_orders'),
      conversions:    sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = ${ORDER_STATUS.DELIVERED})`.as('conversions'),
      returnedOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = ${ORDER_STATUS.RETURNED})`.as('returned_orders'),
    })
    .from(orders)
    .groupBy(orders.product_id)
  )
}


async function fetchProductStats(): Promise<ProductStats> {
  const { t0, t1, t2 } = getMonthRanges()

  const ordersAgg = buildOrdersAggCte()

  const [countsResult, highReturnResult] = await Promise.all([

    db.select({
      total:     sql<number>`COUNT(*)`,
      active:    sql<number>`COUNT(*) FILTER (WHERE "products"."is_active" = true)`,
      suspended: sql<number>`COUNT(*) FILTER (WHERE "products"."is_active" = false)`,// hna kont ra7 ndirha tata7sab hkda (total-active)-> bs7 9rit 3liha wl9itha kif kif

      newTotal:      sql<number>`COUNT(*) FILTER (
                       WHERE "products"."created_at" >= ${t1}::timestamptz
                         AND "products"."created_at" <  ${t2}::timestamptz
                     )`,
      newTotalPrev:  sql<number>`COUNT(*) FILTER (
                       WHERE "products"."created_at" >= ${t0}::timestamptz
                         AND "products"."created_at" <  ${t1}::timestamptz
                     )`,
      newActive:     sql<number>`COUNT(*) FILTER (
                       WHERE "products"."is_active" = true
                         AND "products"."created_at" >= ${t1}::timestamptz
                         AND "products"."created_at" <  ${t2}::timestamptz
                     )`,
      newActivePrev: sql<number>`COUNT(*) FILTER (
                       WHERE "products"."is_active" = true
                         AND "products"."created_at" >= ${t0}::timestamptz
                         AND "products"."created_at" <  ${t1}::timestamptz
                     )`,
      newSusp:       sql<number>`COUNT(*) FILTER (
                       WHERE "products"."is_active" = false
                         AND "products"."created_at" >= ${t1}::timestamptz
                         AND "products"."created_at" <  ${t2}::timestamptz
                     )`,
      newSuspPrev:   sql<number>`COUNT(*) FILTER (
                       WHERE "products"."is_active" = false
                         AND "products"."created_at" >= ${t0}::timestamptz
                         AND "products"."created_at" <  ${t1}::timestamptz
                     )`,
    })
    .from(products)
    .where(isNull(products.deleted_at)),

    db.with(ordersAgg)
      .select({ c: sql<number>`COUNT(*)` })
      .from(products)
      .leftJoin(ordersAgg, eq(products.id, ordersAgg.productId))
      .where(
        and(
          isNull(products.deleted_at),
          eq(products.is_active, true),
          sql`
            CASE
              WHEN ${ordersAgg.totalOrders} IS NULL OR ${ordersAgg.totalOrders} = 0
                THEN false
              ELSE (${ordersAgg.returnedOrders}::float / ${ordersAgg.totalOrders}::float * 100) > ${HIGH_RETURN_THRESHOLD}
            END
          `,
        )
      ),
  ])

  const r  = countsResult[0]
  const hr = highReturnResult[0]
  const n  = (v: unknown) => Number(v ?? 0)

  return {
    total:           { value: n(r.total),     newThisMonth: n(r.newTotal),  changeVsPrev: growthRate(n(r.newTotal),  n(r.newTotalPrev))  },
    active:          { value: n(r.active),    newThisMonth: n(r.newActive), changeVsPrev: growthRate(n(r.newActive), n(r.newActivePrev)) },
    suspended:       { value: n(r.suspended), newThisMonth: n(r.newSusp),   changeVsPrev: growthRate(n(r.newSusp),   n(r.newSuspPrev))   },
    highReturnCount: { value: n(hr?.c),       newThisMonth: 0,              changeVsPrev: 0 },
  }
}

async function fetchProducts(): Promise<Product[]> {
  const ordersAgg = buildOrdersAggCte()

  const rows = await db
    .with(ordersAgg)
    .select({
      id:             products.id,
      name:           products.name,
      category:       products.category,
      priceDzd:       products.merchant_price_dzd,
      stockQty:       products.stock_qty,
      isActive:       products.is_active,
      createdAt:      products.created_at,
      merchantName:   merchantProfiles.business_name,
      merchantWilaya: users.wilaya,

      returnRate: sql<number>`
        CASE
          WHEN ${ordersAgg.totalOrders} IS NULL OR ${ordersAgg.totalOrders} = 0
            THEN 0
          ELSE ROUND(
            ${ordersAgg.returnedOrders}::numeric
            / ${ordersAgg.totalOrders}::numeric * 100,
            1
          )
        END
      `.as('return_rate'),

      conversions: sql<number>`COALESCE(${ordersAgg.conversions}, 0)`.as('conversions'),
    })
    .from(products)
    .innerJoin(merchantProfiles, eq(merchantProfiles.id, products.merchant_id))
    .innerJoin(users,            eq(users.id, merchantProfiles.user_id))
    .leftJoin(ordersAgg,         eq(products.id, ordersAgg.productId))
    .where(
      and(
        isNull(products.deleted_at),
        isNull(users.deleted_at),
      )
    )
    .orderBy(desc(products.created_at), products.id)

  return rows.map((r) => ({
    id:             r.id,
    name:           r.name,
    category:       r.category,
    merchantName:   r.merchantName,
    merchantWilaya: r.merchantWilaya ?? '—',
    priceDzd:       r.priceDzd,
    stockQty:       r.stockQty,
    isActive:       r.isActive,
    returnRate:     Number(r.returnRate),
    conversions:    Number(r.conversions),
    createdAt:      r.createdAt.toISOString().split('T')[0],
  }))
}

export const getProductsData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ProductsData> => {

    const session = await getSession()
    if (!session || session.user.role !== 'super_admin') {
      throw new Error('Unauthorized')
    }

    const [stats, productsList] = await Promise.all([
      fetchProductStats(),
      fetchProducts(),
    ])

    return { stats, products: productsList }
  },
)

// ============================================================
// إجراءات الأدمن على المنتج: إيقاف/تفعيل + حذف ناعم
// ============================================================

// تفعيل/إيقاف منتج — يُشعِر التاجر بالتغيير
export const setProductActive = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ productId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()

    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        merchantId: products.merchant_id,
      })
      .from(products)
      .where(and(eq(products.id, data.productId), isNull(products.deleted_at)))
      .limit(1)
    if (!product) throw new Error('المنتج غير موجود')

    await db
      .update(products)
      .set({ is_active: data.isActive })
      .where(eq(products.id, product.id))

    // إشعار التاجر صاحب المنتج
    const [merchant] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, product.merchantId))
      .limit(1)
    if (merchant) {
      await notify({
        userId: merchant.userId,
        type: 'system',
        title: data.isActive ? 'تم تفعيل منتجك' : 'تم إيقاف منتجك',
        body: data.isActive
          ? `أعادت الإدارة تفعيل «${product.name}» — أصبح متاحاً للمسوّقين.`
          : `أوقفت الإدارة عرض «${product.name}» مؤقتاً. تواصل معنا للمزيد.`,
        link: '/merchant/products',
      })
    }

    return { success: true }
  })

// حذف ناعم لمنتج (deleted_at) — يختفي من المنصّة دون فقدان السجلّات المرتبطة
export const softDeleteProduct = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()

    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        merchantId: products.merchant_id,
      })
      .from(products)
      .where(and(eq(products.id, data.productId), isNull(products.deleted_at)))
      .limit(1)
    if (!product) throw new Error('المنتج غير موجود')

    // امنع الحذف إن كانت هناك طلبيات نشِطة (لم تُسلَّم/تُرتجَع بعد) مرتبطة به
    const [{ activeCount }] = await db
      .select({ activeCount: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.product_id, product.id),
          notInArrayActive(),
        ),
      )
    if (Number(activeCount) > 0) {
      throw new Error(
        'لا يمكن حذف منتج عليه طلبيات قيد المعالجة — أوقفه بدل حذفه أو انتظر إنهاء طلبياته',
      )
    }

    await db
      .update(products)
      .set({ deleted_at: new Date(), is_active: false })
      .where(eq(products.id, product.id))

    const [merchant] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, product.merchantId))
      .limit(1)
    if (merchant) {
      await notify({
        userId: merchant.userId,
        type: 'system',
        title: 'تم حذف أحد منتجاتك',
        body: `حذفت الإدارة «${product.name}» من المنصّة.`,
        link: '/merchant/products',
      })
    }

    return { success: true }
  })

// الطلبيات «النشِطة» = ليست في حالة نهائية (مُسلَّمة/مُرتجَعة/ملغاة)
function notInArrayActive() {
  return sql`${orders.status} NOT IN ('delivered', 'returned', 'cancelled')`
}