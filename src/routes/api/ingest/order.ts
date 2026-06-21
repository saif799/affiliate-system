// src/routes/api/ingest/order.ts
//
// نقطة استيراد الطلبيات الخارجية (إضافة WooCommerce على متجر المسوّق).
// المتجر الخارجي يخصّ المسوّق (لا التاجر — التاجر مورّد بالجملة فقط). التدفّق:
//   1) المسوّق يولّد «كود ربط» للمنتج (= tracking_links.slug) ويضعه في إضافة متجره.
//   2) الزبون يطلب على متجر المسوّق؛ تلتقط الإضافة الكودَ من الطلب.
//   3) الإضافة تستدعي هذه النقطة (POST) بالكود + بيانات الطلب.
//   4) نحلّ الكود ← المسوّق + المنتج (ومنه التاجر)، ثم نُنشئ طلبية «pending»
//      مع منع التكرار (idempotency).
//
// لا مصادقة حالياً (بطلب صريح). المسوّق يُشتقّ من الكود مباشرةً.
// الجسم يطابق ما ترسله إضافة WooCommerce فعلاً (انظر BodySchema أدناه):
//   { platform_product_id, wc_order_id, client_name, phone, address, amount, … }
// الحقول الفارغة (client_name/phone/address) تُقبَل وتُستبدَل بقيم افتراضية —
// تُملأ لاحقاً عند مراجعة الطلبية أو عندما ترسلها الإضافة.

import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/server/db'
import {
  affiliateProfiles,
  trackingLinks,
  products,
  orders,
  settings,
} from '#/server/db/schema'
import { and, eq, isNull, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { notify } from '#/server/notify'
import { normalizeDzPhone } from '#/server/attribution/order-forward'

// شكل الجسم كما ترسله إضافة WooCommerce فعلاً. متساهل: القيم الفارغة مقبولة.
const BodySchema = z.object({
  // كود الربط (slug) — يُحدّد المسوّق والمنتج معاً
  platform_product_id: z.string().trim().min(4).max(64),
  // معرّف الطلب في WooCommerce — أساس منع التكرار
  wc_order_id: z.coerce.string().trim().min(1).max(120),
  wc_order_number: z.coerce.string().trim().max(120).optional(),
  // مُتجاهَل — المسوّق يُشتقّ من الكود، لا من هذه القيمة
  affiliate_id: z.string().trim().optional(),
  product_name: z.string().optional(),
  client_name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  address: z.string().trim().max(255).optional(),
  amount: z.coerce.number().int().nonnegative().max(10_000_000).optional(),
  currency: z.string().optional(),
  order_note: z.string().trim().max(1000).optional(),
  submitted_at: z.string().optional(),
  source_site: z.string().optional(),
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

        const code = data.platform_product_id
        const source = 'woocommerce'
        // فريد لكل (طلب WooCommerce + منتج): يسمح بعدّة منتجات في طلب واحد
        const externalOrderId = `${data.wc_order_id}:${code}`.slice(0, 120)

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
              eq(trackingLinks.slug, code),
              eq(trackingLinks.is_active, true),
              isNull(affiliateProfiles.deleted_at),
            ),
          )
          .limit(1)
        if (!link) {
          return json({ success: false, error: 'invalid_code' }, 404)
        }
        const affiliate = { id: link.affiliateId, userId: link.affiliateUserId }

        // 3) المنتج (التاجر يُشتقّ منه). نقبل حتى لو نفد المخزون — الطلب حدث فعلاً.
        const [product] = await db
          .select({
            id: products.id,
            merchantId: products.merchant_id,
            merchantPrice: products.merchant_price_dzd,
            isActive: products.is_active,
            name: products.name,
          })
          .from(products)
          .where(and(eq(products.id, link.productId), isNull(products.deleted_at)))
          .limit(1)
        if (!product || !product.isActive) {
          return json({ success: false, error: 'product_unavailable' }, 409)
        }

        const fees = await getPlatformFees()

        // السعر: قيمة amount إن كانت موجبة، وإلا سعر الجملة كحدٍّ أدنى آمن.
        const salePrice =
          data.amount && data.amount > 0 ? data.amount : product.merchantPrice

        // بيانات الزبون متساهلة: الإضافة قد ترسلها فارغة حالياً.
        const phone = normalizeDzPhone(data.phone)
        const name = data.client_name && data.client_name.length > 0 ? data.client_name : 'زبون'
        const address = data.address && data.address.length > 0 ? data.address : null
        const note = data.order_note && data.order_note.length > 0 ? data.order_note : null

        // 4) إنشاء الطلبية — idempotent عبر (affiliate_id, external_source, external_order_id)
        const inserted = await db
          .insert(orders)
          .values({
            product_id: product.id,
            affiliate_id: affiliate.id,
            merchant_id: product.merchantId,
            tracking_link_id: link.id,
            customer_name: name,
            customer_phone: phone ?? 'غير متوفّر',
            customer_wilaya: 'غير محدد', // الإضافة لا ترسل الولاية بعد
            customer_wilaya_code: null,
            customer_commune: null,
            customer_address: address,
            customer_note: note,
            quantity: 1,
            unit_affiliate_price_dzd: salePrice,
            unit_merchant_price_dzd: product.merchantPrice,
            platform_fee_merchant_dzd: fees.merchant,
            platform_fee_affiliate_dzd: fees.affiliate,
            platform_fee_dzd: fees.merchant + fees.affiliate,
            shipping_fee_dzd: 0,
            status: 'pending',
            external_source: source,
            external_order_id: externalOrderId,
          })
          .onConflictDoNothing()
          .returning({ id: orders.id })

        // تكرار: نفس الطلب وصل سابقاً — استجابة ناجحة بلا تأثير
        if (inserted.length === 0) {
          return json({ success: true, duplicate: true })
        }

        // 5) إشعار المسوّق صاحب المتجر (best-effort)
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
