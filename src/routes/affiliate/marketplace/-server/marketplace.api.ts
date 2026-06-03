// affiliate/marketplace/-server/marketplace.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  affiliateProfiles,
  products,
  merchantProfiles,
  orders,
  trackingLinks,
} from '#/server/db/schema'
import { and, eq, isNull, gt, sql, desc } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type {
  MarketplaceData,
  Product,
  ProductStatus,
  GeneratedLink,
} from '../-marketplace.types'

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

const APP_URL = process.env.VITE_APP_URL ?? 'https://affili.dz'

// ============================================================
// GET MARKETPLACE DATA
// ============================================================

export const getMarketplaceData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MarketplaceData> => {
    await requireAffiliate()

    // المنتجات المتاحة (نشطة، غير محذوفة، متوفرة)
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        merchantId: products.merchant_id,
        merchantName: merchantProfiles.business_name,
        category: products.category,
        thumbnailUrl: products.thumbnail_url,
        imageUrls: products.image_urls,
        videoUrl: products.video_url,
        basePrice: products.merchant_price_dzd,
        stockQty: products.stock_qty,
        lowStockThreshold: products.low_stock_threshold,
        description: products.description,
      })
      .from(products)
      .innerJoin(merchantProfiles, eq(products.merchant_id, merchantProfiles.id))
      .where(
        and(
          eq(products.is_active, true),
          isNull(products.deleted_at),
          gt(products.stock_qty, 0),
        ),
      )
      .orderBy(desc(products.created_at))

    // أداء كل منتج (من سجل الطلبيات عبر المنصة)
    const perfRows = await db
      .select({
        productId: orders.product_id,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        nonPending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} != 'pending')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .groupBy(orders.product_id)

    const perfById = new Map(perfRows.map((r) => [r.productId, r]))

    const productList: Product[] = productRows.map((r) => {
      const perf = perfById.get(r.id)
      const delivered = n(perf?.delivered)
      const returned = n(perf?.returned)
      const nonPending = n(perf?.nonPending)
      const total = n(perf?.total)
      const images = (r.imageUrls ?? []).filter(Boolean)
      const thumbnail = r.thumbnailUrl ?? images[0] ?? ''
      const status: ProductStatus =
        r.stockQty <= r.lowStockThreshold ? 'limited' : 'active'

      return {
        id: r.id,
        name: r.name,
        merchantId: r.merchantId,
        merchantName: r.merchantName,
        category: r.category ?? 'أخرى',
        status,
        thumbnail,
        images,
        videoUrl: r.videoUrl,
        basePrice: r.basePrice,
        stockQty: r.stockQty,
        deliveredRate: nonPending > 0 ? round1((delivered / nonPending) * 100) : 0,
        retourRate: total > 0 ? round1((returned / total) * 100) : 0,
        totalSales: delivered,
        description: r.description ?? '',
      }
    })

    const categories = [...new Set(productList.map((p) => p.category))].sort()

    const prices = productList.map((p) => p.basePrice)
    const stats = {
      totalProducts: productList.length,
      avgBasePrice:
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0,
      minBasePrice: prices.length > 0 ? Math.min(...prices) : 0,
    }

    return { products: productList, categories, stats }
  },
)

// ============================================================
// CREATE TRACKING LINK (نسب حقيقي للمسوّق)
// ============================================================

const CreateLinkSchema = z.object({
  productId: z.string().uuid(),
  subId: z.string().trim().max(64).optional(),
})

export const createTrackingLink = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => CreateLinkSchema.parse(input))
  .handler(async ({ data }): Promise<GeneratedLink> => {
    const { profileId } = await requireAffiliate()
    const subId = data.subId && data.subId.length > 0 ? data.subId : null

    // تأكد أن المنتج متاح
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, data.productId),
          eq(products.is_active, true),
          isNull(products.deleted_at),
        ),
      )
      .limit(1)

    if (!product) throw new Error('المنتج غير متاح')

    // أعِد استخدام رابط نشط موجود لنفس (المسوّق + المنتج + SubID)
    const [existing] = await db
      .select({ slug: trackingLinks.slug, subId: trackingLinks.sub_id })
      .from(trackingLinks)
      .where(
        and(
          eq(trackingLinks.affiliate_id, profileId),
          eq(trackingLinks.product_id, data.productId),
          eq(trackingLinks.is_active, true),
          subId === null
            ? isNull(trackingLinks.sub_id)
            : eq(trackingLinks.sub_id, subId),
        ),
      )
      .limit(1)

    const slug = existing?.slug ?? randomUUID().replace(/-/g, '').slice(0, 10)

    if (!existing) {
      await db.insert(trackingLinks).values({
        product_id: data.productId,
        affiliate_id: profileId,
        slug,
        sub_id: subId,
      })
    }

    return {
      productId: data.productId,
      slug,
      subId,
      finalUrl: `${APP_URL}/p/${slug}`,
    }
  })
