// src/routes/api/attribution/order.ts
//
// نقطة استقبال «الطلبية المنسوبة» من تطبيق Shopify (Order Forwarding).
// عنوانها هو ما يُضبط في ATTRIBUTION_FORWARD_URL لدى التطبيق. لكل طلب
// orders/create منسوب لمسوّق يُرسل التطبيق POST واحداً بهذا الشكل (order-forwarding.md).
//
// المصادقة: ترويسة X-Affiliate-Hmac-Sha256 = HMAC-SHA256(base64) لجسم الطلب الخام،
// بمفتاح ATTRIBUTION_FORWARD_SECRET. إن لم يُضبط السرّ نقبل بلا تحقّق (تطوير فقط).
//
// النسب: الحقل affiliateId = الـ slug المولَّد من createTrackingLink (قيمة ?ref).
// نحلّه ⇒ رابط تتبّع ⇒ (مسوّق + منتج)، والمنتج ⇒ تاجر. ثم نُنشئ طلبية pending.
// منع التكرار عبر (affiliate_id, external_source, external_order_id).

import { createFileRoute } from '@tanstack/react-router'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '#/server/db'
import {
  affiliateProfiles,
  orders,
  products,
  settings,
  trackingLinks,
} from '#/server/db/schema'
import { notify } from '#/server/notify'
import {
  ForwardPayloadSchema,
  processAttributedOrder,
  verifyHmac,
  type AttributionDeps,
} from '#/server/attribution/order-forward'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// رسوم المنصّة الثابتة لكل طلبية (افتراضي 50/50 إن لم تُضبط في settings).
async function getPlatformFees(): Promise<{ merchant: number; affiliate: number }> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(
      inArray(settings.key, ['platform_fee_merchant', 'platform_fee_affiliate']),
    )
  const kv = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    merchant:
      kv.platform_fee_merchant !== undefined
        ? Number(kv.platform_fee_merchant)
        : 50,
    affiliate:
      kv.platform_fee_affiliate !== undefined
        ? Number(kv.platform_fee_affiliate)
        : 50,
  }
}

// عقود DI مدعومة بقاعدة البيانات (المنطق نفسه يُختبَر بمزيّفات في order-forward.test.ts).
const dbDeps: AttributionDeps = {
  async findTrackingLinkBySlug(slug) {
    const [row] = await db
      .select({
        id: trackingLinks.id,
        affiliateId: trackingLinks.affiliate_id,
        affiliateUserId: affiliateProfiles.user_id,
        productId: trackingLinks.product_id,
      })
      .from(trackingLinks)
      .innerJoin(
        affiliateProfiles,
        eq(affiliateProfiles.id, trackingLinks.affiliate_id),
      )
      .where(
        and(
          eq(trackingLinks.slug, slug),
          eq(trackingLinks.is_active, true),
          isNull(affiliateProfiles.deleted_at),
        ),
      )
      .limit(1)
    return row ?? null
  },

  async findProductById(id) {
    const [row] = await db
      .select({
        id: products.id,
        merchantId: products.merchant_id,
        merchantPrice: products.merchant_price_dzd,
        isActive: products.is_active,
        name: products.name,
        sku: products.sku,
      })
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deleted_at)))
      .limit(1)
    return row ?? null
  },

  getPlatformFees,

  async insertOrder(values) {
    const inserted = await db
      .insert(orders)
      .values(values)
      .onConflictDoNothing()
      .returning({ id: orders.id })
    return inserted[0] ?? null
  },

  async notifyNewOrder({ affiliateUserId, productName, shop }) {
    await notify({
      userId: affiliateUserId,
      type: 'order_new',
      title: 'طلبية جديدة منسوبة إليك',
      body: `وصلت طلبية على «${productName}» من ${shop} — راجِعها وأكّدها`,
      link: '/affiliate/orders',
    })
  },
}

export const Route = createFileRoute('/api/attribution/order')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1) الجسم الخام (لازم لحساب الـ HMAC على البايتات نفسها)
        const rawBody = await request.text()

        // 2) المصادقة (HMAC) إن كان السرّ مضبوطاً
        const secret = process.env.ATTRIBUTION_FORWARD_SECRET
        if (secret) {
          const header = request.headers.get('x-affiliate-hmac-sha256')
          if (!verifyHmac(rawBody, header, secret)) {
            return json({ ok: false, error: 'invalid_signature' }, 401)
          }
        }

        // 3) تحليل + تحقّق الحمولة
        let raw: unknown
        try {
          raw = JSON.parse(rawBody)
        } catch {
          return json({ ok: false, error: 'invalid_json' }, 400)
        }
        const parsed = ForwardPayloadSchema.safeParse(raw)
        if (!parsed.success) {
          return json(
            {
              ok: false,
              error: 'invalid_payload',
              details: parsed.error.issues.map((i) => i.path.join('.')),
            },
            422,
          )
        }

        // مؤقّت للتشخيص: نطبع شكل بيانات الزبون كما وصلت فعلاً (أزِله بعد التأكيد).
        // يكشف إن كانت البيانات في shippingAddress أم billingAddress أم noteAttributes.
        try {
          const o = (raw as { order?: Record<string, unknown> })?.order ?? {}
          console.log(
            '[attribution] payload shape:',
            JSON.stringify({
              hasCustomer: !!o.customer,
              hasShipping: !!o.shippingAddress,
              hasBilling: !!o.billingAddress,
              noteAttrNames: Array.isArray(o.noteAttributes)
                ? (o.noteAttributes as Array<{ name?: string }>).map((a) => a?.name)
                : [],
              customer: o.customer ?? null,
              shippingAddress: o.shippingAddress ?? null,
              billingAddress: o.billingAddress ?? null,
            }),
          )
        } catch {
          /* تجاهل التسجيل */
        }

        // 4) النسب + الإنشاء
        let result
        try {
          result = await processAttributedOrder(parsed.data, dbDeps)
        } catch (err) {
          // عطل قاعدة/شبكة — نُعيد 5xx كي يُعيد التطبيق المحاولة مرّة واحدة.
          console.error('[attribution] فشل معالجة الطلبية:', err)
          return json({ ok: false, error: 'internal_error' }, 500)
        }

        // 5) نؤكّد الاستلام بـ 2xx دائماً (حتى للطلبات غير القابلة للنسب) كي لا
        //    يُعيد التطبيق المحاولة بلا فائدة على slug/منتج غير صالح.
        return json({ ok: true, ...result })
      },
    },
  },
})
