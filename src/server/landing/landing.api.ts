// src/server/landing/landing.api.ts
//
// دوال عامّة (بلا مصادقة) لصفحة بيع المسوّق /p/<slug>:
//   - getPublicLanding: إعدادات الصفحة (عنوان/وصف/صور/سعر/ألوان) + قائمة الولايات.
//   - getPublicOffices: بلديات/مكاتب ولاية (تُحمَّل عند اختيار الولاية).
//   - createPublicOrder: يُنشئ طلبية كاملة (سعر + توصيل محسوب) مربوطة بالمسوّق والتاجر.
//
// النموذج المالي مطابق للطلبية اليدوية (qty=1): يدفع الزبون سعر المنتج + التوصيل
// (إلا إن جعله المسوّق مجانياً فيتحمّله من ربحه). كل الحسابات تُعاد على الخادم.

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import {
  trackingLinks,
  products,
  merchantProfiles,
  affiliateProfiles,
  users,
  orders,
  settings,
  deliveryPricing,
  deliveryOffices,
} from '#/server/db/schema'
import { and, eq, isNull, sql, inArray, asc, gte } from 'drizzle-orm'
import { z } from 'zod'
import { notify } from '#/server/notify'

// ── أنواع العرض ──────────────────────────────────────────────

export interface LandingWilaya {
  code: number
  name: string
  homePrice: number
  officePrice: number
}

export interface PublicLanding {
  slug: string
  enabled: boolean // هل الصفحة منشورة بسعر صريح؟ (إن لا، لا يُعرَض نموذج الطلب)
  productName: string
  merchantName: string
  title: string
  description: string | null
  images: string[]
  videoUrl: string | null
  links: string[]
  category: string | null
  price: number // سعر المنتج (لكل قطعة) الذي حدّده المسوّق
  freeOffice: boolean
  freeHome: boolean
  accent: string // hex
  wilayas: LandingWilaya[]
}

// ── كاش بسيط لقائمة الولايات (تتغيّر نادراً) لتحمّل الضغط العالي ──
let wilayaCache: { at: number; rows: LandingWilaya[] } | null = null
const WILAYA_TTL = 5 * 60 * 1000

async function loadWilayas(): Promise<LandingWilaya[]> {
  const now = Date.now()
  if (wilayaCache && now - wilayaCache.at < WILAYA_TTL) return wilayaCache.rows
  const rows = await db
    .select({
      code: deliveryPricing.wilaya_id,
      name: deliveryPricing.wilaya_name,
      home: deliveryPricing.home_price_dzd,
      office: deliveryPricing.office_price_dzd,
    })
    .from(deliveryPricing)
    .orderBy(asc(deliveryPricing.wilaya_id))
  const mapped = rows.map((r) => ({
    code: r.code,
    name: r.name,
    homePrice: r.home,
    officePrice: r.office,
  }))
  wilayaCache = { at: now, rows: mapped }
  return mapped
}

const DEFAULT_ACCENT = '#7c3aed'

// ============================================================
// GET LANDING — إعدادات الصفحة + الولايات
// ============================================================

export const getPublicLanding = createServerFn({ method: 'GET' })
  .validator((i: unknown) => z.object({ slug: z.string().trim().min(4).max(64) }).parse(i))
  .handler(async ({ data }): Promise<PublicLanding | null> => {
    const [row] = await db
      .select({
        slug: trackingLinks.slug,
        linkId: trackingLinks.id,
        landingEnabled: trackingLinks.landing_enabled,
        salePrice: trackingLinks.sale_price_dzd,
        title: trackingLinks.landing_title,
        landingDesc: trackingLinks.landing_description,
        landingImages: trackingLinks.landing_images,
        freeOffice: trackingLinks.free_office_delivery,
        freeHome: trackingLinks.free_home_delivery,
        accent: trackingLinks.accent_color,
        productName: products.name,
        productDesc: products.description,
        productImages: products.image_urls,
        productThumb: products.thumbnail_url,
        productVideo: products.video_url,
        productLinks: products.links,
        category: products.category,
        merchantPrice: products.merchant_price_dzd,
        merchantName: merchantProfiles.business_name,
        isActive: products.is_active,
        deletedAt: products.deleted_at,
      })
      .from(trackingLinks)
      .innerJoin(products, eq(trackingLinks.product_id, products.id))
      .innerJoin(merchantProfiles, eq(products.merchant_id, merchantProfiles.id))
      .where(and(eq(trackingLinks.slug, data.slug), eq(trackingLinks.is_active, true)))
      .limit(1)

    if (!row || !row.isActive || row.deletedAt) return null

    // سجّل النقرة (best-effort — لا يُفشِل عرض الصفحة)
    db.update(trackingLinks)
      .set({ click_count: sql`${trackingLinks.click_count} + 1` })
      .where(eq(trackingLinks.id, row.linkId))
      .catch(() => {})

    const productImages = (row.productImages ?? []).filter(Boolean)
    const chosen = (row.landingImages ?? []).filter(Boolean)
    const images = chosen.length
      ? chosen
      : productImages.length
        ? productImages
        : row.productThumb
          ? [row.productThumb]
          : []

    // السعر المعروض: سعر المسوّق إن نُشرت الصفحة، وإلا 0 (لا نكشف سعر الجملة للزبون)
    const price = row.landingEnabled && row.salePrice ? row.salePrice : 0

    return {
      slug: row.slug,
      enabled: row.landingEnabled,
      productName: row.productName,
      merchantName: row.merchantName,
      title: row.title?.trim() || row.productName,
      description: row.landingDesc?.trim() || row.productDesc,
      images,
      videoUrl: row.productVideo,
      links: (row.productLinks ?? []).filter(Boolean),
      category: row.category,
      price,
      freeOffice: row.freeOffice,
      freeHome: row.freeHome,
      accent: row.accent?.trim() || DEFAULT_ACCENT,
      wilayas: await loadWilayas(),
    }
  })

// ============================================================
// GET OFFICES — بلديات/مكاتب ولاية
// ============================================================

export interface LandingOffice {
  id: string
  name: string
  hasStopDesk: boolean
}

export const getPublicOffices = createServerFn({ method: 'GET' })
  .validator((i: unknown) =>
    z.object({ wilayaCode: z.number().int().min(1).max(58) }).parse(i),
  )
  .handler(async ({ data }): Promise<LandingOffice[]> => {
    const rows = await db
      .select({
        id: deliveryOffices.id,
        name: deliveryOffices.name,
        hasStopDesk: deliveryOffices.has_stop_desk,
      })
      .from(deliveryOffices)
      .where(eq(deliveryOffices.wilaya_id, data.wilayaCode))
      .orderBy(asc(deliveryOffices.name))
    return rows.map((r) => ({ id: r.id, name: r.name, hasStopDesk: r.hasStopDesk }))
  })

// ============================================================
// CREATE ORDER — طلبية كاملة من صفحة الهبوط
// ============================================================

const OrderSchema = z.object({
  slug: z.string().trim().min(4).max(64),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^0[5-7][0-9]{8}$/, 'رقم هاتف جزائري غير صالح'),
  wilayaCode: z.number().int().min(1).max(58),
  officeId: z.string().uuid(),
  deliveryType: z.enum(['home', 'office']),
  address: z.string().trim().max(255).optional(),
})

export const createPublicOrder = createServerFn({ method: 'POST' })
  .validator((i: unknown) => OrderSchema.parse(i))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // 1) حلّ الرابط ← المسوّق + المنتج + إعدادات الصفحة
    const [link] = await db
      .select({
        id: trackingLinks.id,
        affiliateId: trackingLinks.affiliate_id,
        productId: trackingLinks.product_id,
        salePrice: trackingLinks.sale_price_dzd,
        landingEnabled: trackingLinks.landing_enabled,
        freeOffice: trackingLinks.free_office_delivery,
        freeHome: trackingLinks.free_home_delivery,
      })
      .from(trackingLinks)
      .where(and(eq(trackingLinks.slug, data.slug), eq(trackingLinks.is_active, true)))
      .limit(1)
    if (!link) throw new Error('الرابط غير صالح أو منتهٍ')
    // الصفحة يجب أن تكون منشورة بسعر صريح (لا بيع بسعر الجملة عبر رابط غير منشور)
    if (!link.landingEnabled || !link.salePrice)
      throw new Error('هذه الصفحة غير منشورة بعد')

    // المسوّق صاحب الصفحة يجب أن يكون حسابه نشِطاً (لا يبيع المعلَّقون)
    const [aff] = await db
      .select({ userId: affiliateProfiles.user_id, status: users.status })
      .from(affiliateProfiles)
      .innerJoin(users, eq(users.id, affiliateProfiles.user_id))
      .where(eq(affiliateProfiles.id, link.affiliateId))
      .limit(1)
    if (!aff || aff.status !== 'active') throw new Error('الصفحة غير متاحة حالياً')

    const [product] = await db
      .select({
        id: products.id,
        merchantId: products.merchant_id,
        merchantPrice: products.merchant_price_dzd,
        isActive: products.is_active,
        stockQty: products.stock_qty,
        name: products.name,
      })
      .from(products)
      .where(and(eq(products.id, link.productId), isNull(products.deleted_at)))
      .limit(1)
    if (!product || !product.isActive) throw new Error('المنتج غير متاح حالياً')
    if (product.stockQty <= 0) throw new Error('نفد مخزون هذا المنتج')

    // 2) منطقة التوصيل + السعر (يُعاد حسابه على الخادم — لا نثق بالعميل)
    const [office] = await db
      .select({
        id: deliveryOffices.id,
        name: deliveryOffices.name,
        wilayaId: deliveryOffices.wilaya_id,
        hasStopDesk: deliveryOffices.has_stop_desk,
      })
      .from(deliveryOffices)
      .where(eq(deliveryOffices.id, data.officeId))
      .limit(1)
    if (!office || office.wilayaId !== data.wilayaCode)
      throw new Error('البلدية غير مطابقة للولاية')
    if (data.deliveryType === 'office' && !office.hasStopDesk)
      throw new Error('هذه البلدية لا تملك مكتب استلام')
    if (data.deliveryType === 'home' && !data.address?.trim())
      throw new Error('العنوان مطلوب للتوصيل المنزلي')

    const [pricing] = await db
      .select({
        home: deliveryPricing.home_price_dzd,
        office: deliveryPricing.office_price_dzd,
        name: deliveryPricing.wilaya_name,
      })
      .from(deliveryPricing)
      .where(eq(deliveryPricing.wilaya_id, data.wilayaCode))
      .limit(1)
    if (!pricing) throw new Error('لا توجد تعرفة توصيل لهذه الولاية')

    const deliveryPrice = data.deliveryType === 'office' ? pricing.office : pricing.home
    const free = data.deliveryType === 'office' ? link.freeOffice : link.freeHome
    const salePrice = link.salePrice ?? product.merchantPrice // مضمون بالحارس أعلاه

    // الرسوم
    const feeRows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, ['platform_fee_merchant', 'platform_fee_affiliate']))
    const kv = Object.fromEntries(feeRows.map((r) => [r.key, r.value]))
    const feeM = kv.platform_fee_merchant !== undefined ? Number(kv.platform_fee_merchant) : 50
    const feeA = kv.platform_fee_affiliate !== undefined ? Number(kv.platform_fee_affiliate) : 50

    // المبلغ المدفوع عند الاستلام (COD) = سعر المنتج + التوصيل (إن لم يكن مجانياً).
    // يُختزن في unit_affiliate_price ليطابق montant=affiliatePrice×qty وحساب العمولة.
    const unitAffiliate = salePrice + (free ? 0 : deliveryPrice)

    // منع الإرسال المكرّر (نقر مزدوج/إساءة بسيطة): نفس الرابط + الهاتف خلال 10 دقائق
    const [dup] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.tracking_link_id, link.id),
          eq(orders.customer_phone, data.customerPhone),
          eq(orders.status, 'pending'),
          gte(orders.created_at, new Date(Date.now() - 10 * 60 * 1000)),
        ),
      )
      .limit(1)
    if (dup) return { success: true }

    await db.insert(orders).values({
      product_id: product.id,
      affiliate_id: link.affiliateId,
      merchant_id: product.merchantId,
      tracking_link_id: link.id,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_wilaya: pricing.name,
      customer_wilaya_code: data.wilayaCode,
      customer_commune: office.name,
      customer_address: data.deliveryType === 'home' ? (data.address ?? null) : null,
      quantity: 1,
      unit_affiliate_price_dzd: unitAffiliate,
      unit_merchant_price_dzd: product.merchantPrice,
      platform_fee_merchant_dzd: feeM,
      platform_fee_affiliate_dzd: feeA,
      platform_fee_dzd: feeM + feeA,
      shipping_fee_dzd: deliveryPrice,
      delivery_type: data.deliveryType,
      delivery_office_id: data.deliveryType === 'office' ? office.id : null,
      status: 'pending',
      external_source: 'landing',
    })

    notify({
      userId: aff.userId,
      type: 'order_new',
      title: 'طلبية جديدة من صفحة البيع',
      body: `طلبية على «${product.name}» — راجِعها وأكّدها`,
      link: '/affiliate/orders',
    }).catch(() => {})

    return { success: true }
  })
