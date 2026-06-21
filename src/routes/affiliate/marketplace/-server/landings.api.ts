// affiliate/marketplace/-server/landings.api.ts
//
// دوال المسوّق لبناء/تعديل «صفحة بيع» (Landing) لمنتج: ضبط السعر، العنوان، الوصف،
// الصور (من صور التاجر أو رفع صور المسوّق)، التوصيل المجاني، ولون التمييز.
// كل صفحة = صفّ tracking_links (sub_id فارغ) لهذا المسوّق + المنتج.

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { requireAffiliate } from '#/server/auth/guards'
import {
  products,
  merchantProfiles,
  affiliateProfiles,
  trackingLinks,
  settings,
} from '#/server/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { randomUUID, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { saveImage } from '#/server/storage'
import { getAppBaseUrl } from '#/lib/app-url'

const APP_URL = getAppBaseUrl()

// صورة مقبولة: مسار رفع محلّي فقط (صور التاجر أو مرفوعات المسوّق) — لا روابط
// خارجية اعتباطية تُضمَّن على الصفحة العامّة.
const imageRef = z
  .string()
  .trim()
  .max(500)
  .regex(/^\/uploads\/[\w./-]+$/, 'رابط صورة غير صالح')

// ============================================================
// GET LANDING CONFIG — للتحرير (إعدادات حالية أو افتراضية)
// ============================================================

export interface LandingConfig {
  productId: string
  productName: string
  merchantName: string
  basePrice: number // سعر الجملة (تكلفة المسوّق)
  minPrice: number // أدنى سعر مسموح = الجملة + رسوم المنصة
  productImages: string[] // صور التاجر المتاحة للاختيار
  // الإعدادات الحالية (أو افتراضية إن لم تُنشأ صفحة بعد)
  enabled: boolean
  slug: string | null
  finalUrl: string | null
  salePrice: number
  title: string
  description: string
  images: string[]
  freeOffice: boolean
  freeHome: boolean
  accent: string
}

async function getFeeAffiliate(): Promise<number> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'platform_fee_affiliate'))
    .limit(1)
  return row ? Number(row.value) : 50
}

export const getLandingConfig = createServerFn({ method: 'GET' })
  .validator((i: unknown) => z.object({ productId: z.string().uuid() }).parse(i))
  .handler(async ({ data }): Promise<LandingConfig> => {
    const { profileId } = await requireAffiliate()

    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        merchantName: merchantProfiles.business_name,
        basePrice: products.merchant_price_dzd,
        images: products.image_urls,
        thumb: products.thumbnail_url,
        description: products.description,
        isActive: products.is_active,
      })
      .from(products)
      .innerJoin(merchantProfiles, eq(products.merchant_id, merchantProfiles.id))
      .where(and(eq(products.id, data.productId), isNull(products.deleted_at)))
      .limit(1)
    if (!product || !product.isActive) throw new Error('المنتج غير متاح')

    const fee = await getFeeAffiliate()
    const productImages = (product.images ?? []).filter(Boolean)
    if (productImages.length === 0 && product.thumb) productImages.push(product.thumb)
    const minPrice = product.basePrice + fee

    const [existing] = await db
      .select({
        slug: trackingLinks.slug,
        enabled: trackingLinks.landing_enabled,
        salePrice: trackingLinks.sale_price_dzd,
        title: trackingLinks.landing_title,
        description: trackingLinks.landing_description,
        images: trackingLinks.landing_images,
        freeOffice: trackingLinks.free_office_delivery,
        freeHome: trackingLinks.free_home_delivery,
        accent: trackingLinks.accent_color,
      })
      .from(trackingLinks)
      .where(
        and(
          eq(trackingLinks.affiliate_id, profileId),
          eq(trackingLinks.product_id, data.productId),
          isNull(trackingLinks.sub_id),
          eq(trackingLinks.is_active, true),
        ),
      )
      .limit(1)

    return {
      productId: product.id,
      productName: product.name,
      merchantName: product.merchantName,
      basePrice: product.basePrice,
      minPrice,
      productImages,
      enabled: existing?.enabled ?? false,
      slug: existing?.slug ?? null,
      finalUrl: existing ? `${APP_URL}/p/${existing.slug}` : null,
      salePrice: existing?.salePrice ?? minPrice,
      title: existing?.title ?? product.name,
      description: existing?.description ?? product.description ?? '',
      images: (existing?.images ?? productImages.slice(0, 4)).filter(Boolean),
      freeOffice: existing?.freeOffice ?? false,
      freeHome: existing?.freeHome ?? false,
      accent: existing?.accent ?? '#7c3aed',
    }
  })

// ============================================================
// SAVE LANDING — إنشاء/تحديث صفحة البيع
// ============================================================

const SaveSchema = z.object({
  productId: z.string().uuid(),
  salePrice: z.number().int().positive().max(10_000_000),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().default(''),
  images: z.array(imageRef).max(8).default([]),
  freeOffice: z.boolean().default(false),
  freeHome: z.boolean().default(false),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#7c3aed'),
})

export const saveLanding = createServerFn({ method: 'POST' })
  .validator((i: unknown) => SaveSchema.parse(i))
  .handler(async ({ data }): Promise<{ slug: string; finalUrl: string }> => {
    const { profileId } = await requireAffiliate()

    const [product] = await db
      .select({ id: products.id, basePrice: products.merchant_price_dzd, isActive: products.is_active })
      .from(products)
      .where(and(eq(products.id, data.productId), isNull(products.deleted_at)))
      .limit(1)
    if (!product || !product.isActive) throw new Error('المنتج غير متاح')

    const fee = await getFeeAffiliate()
    const minPrice = product.basePrice + fee
    if (data.salePrice < minPrice) {
      throw new Error(
        `سعر البيع لا يمكن أن يقل عن ${minPrice} د.ج (الجملة ${product.basePrice} + رسوم المنصة ${fee})`,
      )
    }

    const config = {
      landing_enabled: true,
      sale_price_dzd: data.salePrice,
      landing_title: data.title,
      landing_description: data.description || null,
      landing_images: data.images,
      free_office_delivery: data.freeOffice,
      free_home_delivery: data.freeHome,
      accent_color: data.accent,
    }

    // أعِد استخدام صفّ الصفحة الأساسي (sub_id فارغ) إن وُجد، وإلا أنشئ صفحة جديدة
    const [existing] = await db
      .select({ id: trackingLinks.id, slug: trackingLinks.slug })
      .from(trackingLinks)
      .where(
        and(
          eq(trackingLinks.affiliate_id, profileId),
          eq(trackingLinks.product_id, data.productId),
          isNull(trackingLinks.sub_id),
          eq(trackingLinks.is_active, true),
        ),
      )
      .limit(1)

    let slug: string
    if (existing) {
      slug = existing.slug
      await db.update(trackingLinks).set(config).where(eq(trackingLinks.id, existing.id))
    } else {
      slug = randomUUID().replace(/-/g, '').slice(0, 10)
      await db.insert(trackingLinks).values({
        product_id: data.productId,
        affiliate_id: profileId,
        slug,
        ...config,
      })
    }

    return { slug, finalUrl: `${APP_URL}/p/${slug}` }
  })

// ============================================================
// UPLOAD IMAGE — رفع المسوّق لصوره الخاصة للصفحة
// ============================================================

export const uploadLandingImage = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('بيانات غير صالحة')
    return input
  })
  .handler(async ({ data }): Promise<{ urls: string[] }> => {
    await requireAffiliate()
    const files = data.getAll('images').filter((f): f is File => f instanceof File)
    if (files.length === 0) throw new Error('لا توجد صور')
    if (files.length > 6) throw new Error('الحد الأقصى 6 صور')
    const urls: string[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) throw new Error('الملف يجب أن يكون صورة')
      urls.push(await saveImage(file))
    }
    return { urls }
  })

// ============================================================
// INGEST API KEY — مفتاح ربط متجر المسوّق الخارجي (extension)
// المتجر الخارجي يخصّ المسوّق (لا التاجر) — يُولّد عند الطلب، ويُمكن إعادة توليده.
// ============================================================

export const getOrCreateIngestKey = createServerFn({ method: 'POST' })
  .validator((i: unknown) =>
    z.object({ regenerate: z.boolean().optional() }).parse(i ?? {}),
  )
  .handler(async ({ data }): Promise<{ apiKey: string; ingestUrl: string }> => {
    const { profileId } = await requireAffiliate()

    const [a] = await db
      .select({ key: affiliateProfiles.ingest_api_key })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, profileId))
      .limit(1)

    let key = a?.key ?? null
    if (!key || data.regenerate) {
      key = `wk_${randomBytes(24).toString('hex')}`
      await db
        .update(affiliateProfiles)
        .set({ ingest_api_key: key })
        .where(eq(affiliateProfiles.id, profileId))
    }

    return { apiKey: key, ingestUrl: `${APP_URL}/api/ingest/order` }
  })
