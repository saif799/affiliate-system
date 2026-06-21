// src/routes/api/ingest/order.ts
//
// نقطة استيراد الطلبيات الخارجية (extension على متجر المسوّق: WooCommerce/Shopify…).
// المتجر الخارجي يخصّ المسوّق (لا التاجر — التاجر مورّد بالجملة فقط). التدفّق:
//   1) المسوّق يولّد «كود ربط» للمنتج (= tracking_links.slug) ويضعه في إضافة متجره.
//   2) الزبون يطلب على متجر المسوّق الخارجي؛ تلتقط الـextension الكودَ من الطلب.
//   3) الـextension تستدعي هذه النقطة (POST) بمفتاح المسوّق + الكود + بيانات الطلب.
//   4) نصادق المسوّق بمفتاحه، ونتحقّق أنّ الكود يخصّه، ثم نُنشئ طلبية «pending»
//      مربوطة به وبتاجر المنتج — مع منع التكرار (idempotency).
//
// المصادقة: ترويسة  x-api-key: <affiliate_profiles.ingest_api_key>
// الاستجابة: JSON. الأخطاء لا تُسرّب تفاصيل داخلية.

import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/server/db'
import {
  affiliateProfiles,
  trackingLinks,
  products,
  orders,
  settings,
  deliveryPricing,
} from '#/server/db/schema'
import { and, eq, isNull, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { notify } from '#/server/notify'

const BodySchema = z.object({
  code: z.string().trim().min(4).max(64), // كود الربط (slug)
  externalOrderId: z.string().trim().min(1).max(120), // معرّف الطلب في المتجر الخارجي
  source: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]{2,32}$/)
    .optional(), // woocommerce/shopify/...
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    // هاتف جزائري صالح (نفس تحقّق صفحة البيع والطلبية اليدوية)
    phone: z.string().trim().regex(/^0[5-7][0-9]{8}$/),
    wilaya: z.string().trim().min(1).max(60),
    wilayaCode: z.number().int().min(1).max(58).optional(),
    commune: z.string().trim().max(80).optional(),
    address: z.string().trim().max(255).optional(),
  }),
  salePrice: z.number().int().positive().max(10_000_000),
  quantity: z.number().int().min(1).max(1000).default(1),
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

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

export const Route = createFileRoute('/api/ingest/order')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ملاحظة: لا مصادقة حالياً (بطلب صريح) — المسوّق يُشتقّ من الكود (slug)
        // مباشرةً، فالـ slug يخصّ مسوّقاً واحداً أصلاً. يمكن إعادة مفتاح x-api-key
        // لاحقاً دون تغيير منطق النسب.

        // 1) قراءة وتحقّق الجسم
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return json({ success: false, error: 'invalid_json' }, 400)
        }
        const parsed = BodySchema.safeParse(raw)
        if (!parsed.success) {
          return json(
            { success: false, error: 'invalid_payload', details: parsed.error.issues.map((i) => i.path.join('.')) },
            422,
          )
        }
        const data = parsed.data
        const source = data.source ?? 'external'

        // 2) حلّ الكود ← رابط التتبّع (ومنه المسوّق + المنتج + مستخدم المسوّق للإشعار)
        const [link] = await db
          .select({
            id: trackingLinks.id,
            affiliateId: trackingLinks.affiliate_id,
            productId: trackingLinks.product_id,
            affiliateUserId: affiliateProfiles.user_id,
          })
          .from(trackingLinks)
          .innerJoin(
            affiliateProfiles,
            eq(affiliateProfiles.id, trackingLinks.affiliate_id),
          )
          .where(
            and(
              eq(trackingLinks.slug, data.code),
              eq(trackingLinks.is_active, true),
              isNull(affiliateProfiles.deleted_at),
            ),
          )
          .limit(1)
        // كود غير موجود — رسالة موحّدة كي لا تُسرّب وجود الـ slug
        if (!link) {
          return json({ success: false, error: 'invalid_code' }, 404)
        }
        // المسوّق المنسوب إليه (من الكود)
        const affiliate = { id: link.affiliateId, userId: link.affiliateUserId }

        // 4) المنتج يجب أن يكون متاحاً ومتوفّراً (التاجر يُشتقّ من المنتج للربط)
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
        if (!product || !product.isActive) {
          return json({ success: false, error: 'product_unavailable' }, 409)
        }
        if (product.stockQty < data.quantity) {
          return json({ success: false, error: 'out_of_stock' }, 409)
        }

        // 5) السعر: لا نثق بقيمة العميل إلا كسعر بيع، والحدّ الأدنى = سعر الجملة
        if (data.salePrice < product.merchantPrice) {
          return json({ success: false, error: 'sale_price_below_cost' }, 422)
        }

        const fees = await getPlatformFees()

        // سعر التوصيل (لقطة) من التعرفة المحلّية إن توفّر رمز الولاية — وإلا 0
        // (يُكمل المسوّق تفاصيل التوصيل عند مراجعة/تأكيد الطلبية).
        let shipping = 0
        if (data.customer.wilayaCode) {
          const [pricing] = await db
            .select({ home: deliveryPricing.home_price_dzd })
            .from(deliveryPricing)
            .where(eq(deliveryPricing.wilaya_id, data.customer.wilayaCode))
            .limit(1)
          if (pricing) shipping = pricing.home
        }

        // 6) إنشاء الطلبية — idempotent عبر (external_source, external_order_id)
        const inserted = await db
          .insert(orders)
          .values({
            product_id: product.id,
            affiliate_id: affiliate.id,
            merchant_id: product.merchantId,
            tracking_link_id: link.id,
            customer_name: data.customer.name,
            customer_phone: data.customer.phone,
            customer_wilaya: data.customer.wilaya,
            customer_wilaya_code: data.customer.wilayaCode ?? null,
            customer_commune: data.customer.commune ?? null,
            customer_address: data.customer.address ?? null,
            quantity: data.quantity,
            unit_affiliate_price_dzd: data.salePrice,
            unit_merchant_price_dzd: product.merchantPrice,
            platform_fee_merchant_dzd: fees.merchant,
            platform_fee_affiliate_dzd: fees.affiliate,
            platform_fee_dzd: fees.merchant + fees.affiliate,
            shipping_fee_dzd: shipping,
            status: 'pending',
            external_source: source,
            external_order_id: data.externalOrderId,
          })
          .onConflictDoNothing()
          .returning({ id: orders.id })

        // تكرار: نفس الطلب الخارجي وصل سابقاً — استجابة ناجحة بلا تأثير
        if (inserted.length === 0) {
          return json({ success: true, duplicate: true })
        }

        // 7) إشعار المسوّق صاحب المتجر (best-effort)
        await notify({
          userId: affiliate.userId,
          type: 'order_new',
          title: 'طلبية جديدة من متجرك الخارجي',
          body: `وصلت طلبية على «${product.name}» من ${source} — راجِعها وأكّدها`,
          link: '/affiliate/orders',
        }).catch(() => {})

        return json({ success: true, orderId: inserted[0].id })
      },
    },
  },
})
