// src/server/attribution/order-forward.ts
//
// منطق «استقبال الطلبية المنسوبة» (Order Forwarding) — مستقلّ عن قاعدة البيانات
// وعن HTTP كي يكون قابلاً للاختبار وحدةً (انظر order-forward.test.ts).
//
// التدفّق (راجع order-forwarding.md):
//   تطبيق Shopify يلتقط قيمة `ref` من رابط المسوّق — وهي *نفسها* الـ slug الذي
//   يولّده createTrackingLink — ثم يُرسلها في الحقل `affiliateId`. نحلّ هذا الـ
//   slug ⇒ رابط تتبّع ⇒ (مسوّق + منتج)، والمنتج ⇒ تاجر. فتُنسَب الطلبية إلى
//   المسوّق الصحيح، على المنتج الصحيح، ومن ثَمّ التاجر الصحيح.
//
// المصادقة (HMAC) ومنطق HTTP موجودان في المسار: src/routes/api/attribution/order.ts

import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

// ── مخطّط الحمولة (Shopify forwarding) ─────────────────────────
// متساهل عمداً: أيّ حقل قد يكون null/غائباً (راجع الجدول في order-forwarding.md).

const LineItemSchema = z.object({
  title: z.string().nullish(),
  variantTitle: z.string().nullish(),
  sku: z.string().nullish(),
  quantity: z.number().int().positive().catch(1),
  price: z.string().nullish(),
  productId: z.string().nullish(),
  variantId: z.string().nullish(),
})
export type ForwardLineItem = z.infer<typeof LineItemSchema>

export const ForwardPayloadSchema = z.object({
  event: z.string(),
  sentAt: z.string().nullish(),
  shop: z.string().trim().min(1),
  // = الـ slug المولَّد من createTrackingLink (قيمة ?ref في رابط المسوّق)
  affiliateId: z.string().trim().min(1),
  order: z.object({
    id: z.string().trim().min(1),
    gid: z.string().nullish(),
    number: z.number().nullish(),
    name: z.string().nullish(),
    createdAt: z.string().nullish(),
    currency: z.string().nullish(),
    totalPrice: z.string().nullish(),
    subtotalPrice: z.string().nullish(),
    totalTax: z.string().nullish(),
    totalDiscounts: z.string().nullish(),
    totalShipping: z.string().nullish(),
    financialStatus: z.string().nullish(),
    note: z.string().nullish(),
    noteAttributes: z
      .array(z.object({ name: z.string(), value: z.string() }))
      .catch([]),
    lineItems: z.array(LineItemSchema).default([]),
    customer: z
      .object({
        firstName: z.string().nullish(),
        lastName: z.string().nullish(),
        email: z.string().nullish(),
        phone: z.string().nullish(),
      })
      .nullish(),
    shippingAddress: z
      .object({
        name: z.string().nullish(),
        phone: z.string().nullish(),
        address1: z.string().nullish(),
        address2: z.string().nullish(),
        city: z.string().nullish(),
        province: z.string().nullish(),
        country: z.string().nullish(),
        countryCode: z.string().nullish(),
        zip: z.string().nullish(),
      })
      .nullish(),
  }),
})
export type ForwardPayload = z.infer<typeof ForwardPayloadSchema>

// ── HMAC (أصالة الطلب) ─────────────────────────────────────────
// نحسب HMAC-SHA256 على *بايتات الجسم الخام* بنفس السرّ ونقارن بثبات-الزمن.
export function verifyHmac(
  rawBody: string,
  header: string | null | undefined,
  secret: string,
): boolean {
  if (!header) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
  let got: Buffer
  try {
    got = Buffer.from(header, 'base64')
  } catch {
    return false
  }
  return expected.length === got.length && timingSafeEqual(expected, got)
}

// ── مساعدات تطبيع ───────────────────────────────────────────────

// هاتف جزائري إلى الصيغة المحلّية 0XXXXXXXXX (Shopify يرسل +213…).
export function normalizeDzPhone(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null
  let s = raw.replace(/[^\d+]/g, '')
  if (s.startsWith('+213')) s = '0' + s.slice(4)
  else if (s.startsWith('00213')) s = '0' + s.slice(5)
  else if (s.startsWith('213') && s.length === 12) s = '0' + s.slice(3)
  return s.length > 0 ? s : null
}

// قيمة نقدية (سلسلة عشرية بالدينار) ⇒ عدد صحيح موجب، أو null إن تعذّر.
export function parseDzd(s: string | null | undefined): number | null {
  if (s == null) return null
  const v = Number(s)
  if (!Number.isFinite(v) || v < 0) return null
  return Math.round(v)
}

// اختيار سطر الطلب المطابق للمنتج المنسوب (بالـ SKU)؛ وإلا أوّل سطر.
export function pickLineItem(
  items: ForwardLineItem[],
  productSku: string | null,
): ForwardLineItem | undefined {
  if (productSku) {
    const sku = productSku.toLowerCase()
    const match = items.find((i) => i.sku && i.sku.toLowerCase() === sku)
    if (match) return match
  }
  return items[0]
}

function customerName(payload: ForwardPayload): string {
  const c = payload.order.customer
  const fromParts = [c?.firstName, c?.lastName]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(' ')
    .trim()
  return fromParts || payload.order.shippingAddress?.name?.trim() || 'زبون'
}

// ── العقود (DI) — تُحقَّق بقاعدة البيانات في المسار، وبمزيّفات في الاختبار ──

export interface TrackingLinkRef {
  id: string
  affiliateId: string // affiliate_profiles.id
  affiliateUserId: string // users.id (للإشعار)
  productId: string
}

export interface ProductRef {
  id: string
  merchantId: string // merchant_profiles.id
  merchantPrice: number // merchant_price_dzd
  isActive: boolean
  name: string
  sku: string | null
}

// شكل صفّ الإدراج في جدول orders (المجموعة المعنيّة بالنسب فقط).
export interface OrderInsert {
  product_id: string
  affiliate_id: string
  merchant_id: string
  tracking_link_id: string
  customer_name: string
  customer_phone: string
  customer_wilaya: string
  customer_commune: string | null
  customer_address: string | null
  quantity: number
  unit_affiliate_price_dzd: number
  unit_merchant_price_dzd: number
  platform_fee_merchant_dzd: number
  platform_fee_affiliate_dzd: number
  platform_fee_dzd: number
  shipping_fee_dzd: number
  status: 'pending'
  external_source: string
  external_order_id: string
}

export interface AttributionDeps {
  findTrackingLinkBySlug(slug: string): Promise<TrackingLinkRef | null>
  findProductById(id: string): Promise<ProductRef | null>
  getPlatformFees(): Promise<{ merchant: number; affiliate: number }>
  // يُرجِع المعرّف عند الإنشاء، أو null إذا كان تكراراً (تعارض idempotency).
  insertOrder(values: OrderInsert): Promise<{ id: string } | null>
  notifyNewOrder?(args: {
    affiliateUserId: string
    productName: string
    shop: string
  }): Promise<void>
}

export type AttributionResult =
  | { status: 'created'; orderId: string }
  | { status: 'duplicate' }
  | { status: 'ignored'; reason: 'unknown_affiliate_link' | 'product_unavailable' }

// ── البناء النقيّ لصفّ الطلبية (النسب الأساسي) ──────────────────
// هنا يحدث الربط الحاسم: المسوّق ← من رابط التتبّع، المنتج ← من رابط التتبّع،
// التاجر ← من المنتج. (لا نرفض لنفاد المخزون: الطلبية حدثت فعلاً على Shopify.)
export function buildOrderInsert(args: {
  payload: ForwardPayload
  link: TrackingLinkRef
  product: ProductRef
  fees: { merchant: number; affiliate: number }
}): OrderInsert {
  const { payload, link, product, fees } = args
  const item = pickLineItem(payload.order.lineItems, product.sku)

  const quantity = item?.quantity && item.quantity > 0 ? item.quantity : 1
  // سعر بيع المسوّق للوحدة: من سطر الطلب، وإلا من المجموع الفرعي/الكمّية، وإلا سعر الجملة.
  const unitAffiliate =
    parseDzd(item?.price) ??
    (() => {
      const sub = parseDzd(payload.order.subtotalPrice)
      return sub != null ? Math.round(sub / quantity) : null
    })() ??
    product.merchantPrice

  const addr = payload.order.shippingAddress
  const phone = normalizeDzPhone(
    payload.order.customer?.phone ?? addr?.phone ?? null,
  )
  const address = [addr?.address1, addr?.address2]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join('، ')
    .trim()

  return {
    product_id: product.id,
    affiliate_id: link.affiliateId,
    merchant_id: product.merchantId,
    tracking_link_id: link.id,
    customer_name: customerName(payload),
    customer_phone: phone ?? 'غير متوفّر',
    customer_wilaya: (addr?.province || addr?.city || 'غير محدد').trim(),
    customer_commune: addr?.city?.trim() || null,
    customer_address: address || null,
    quantity,
    unit_affiliate_price_dzd: Math.max(0, unitAffiliate),
    unit_merchant_price_dzd: product.merchantPrice,
    platform_fee_merchant_dzd: fees.merchant,
    platform_fee_affiliate_dzd: fees.affiliate,
    platform_fee_dzd: fees.merchant + fees.affiliate,
    shipping_fee_dzd: 0, // يُستكمل عند مراجعة/تأكيد الطلبية محلّياً
    status: 'pending',
    // idempotency: (affiliate_id, external_source, external_order_id) — راجع schema.ts
    external_source: `shopify:${payload.shop}`,
    external_order_id: payload.order.id,
  }
}

// ── المعالجة الكاملة: حلّ السلسلة ثم الإدراج ────────────────────
export async function processAttributedOrder(
  payload: ForwardPayload,
  deps: AttributionDeps,
): Promise<AttributionResult> {
  const link = await deps.findTrackingLinkBySlug(payload.affiliateId)
  if (!link) return { status: 'ignored', reason: 'unknown_affiliate_link' }

  const product = await deps.findProductById(link.productId)
  if (!product || !product.isActive)
    return { status: 'ignored', reason: 'product_unavailable' }

  const fees = await deps.getPlatformFees()
  const values = buildOrderInsert({ payload, link, product, fees })

  const inserted = await deps.insertOrder(values)
  if (!inserted) return { status: 'duplicate' }

  if (deps.notifyNewOrder) {
    await deps
      .notifyNewOrder({
        affiliateUserId: link.affiliateUserId,
        productName: product.name,
        shop: payload.shop,
      })
      .catch(() => {})
  }

  return { status: 'created', orderId: inserted.id }
}
