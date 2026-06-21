import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  ForwardPayloadSchema,
  buildOrderInsert,
  normalizeDzPhone,
  parseDzd,
  pickLineItem,
  processAttributedOrder,
  verifyHmac,
  type AttributionDeps,
  type OrderInsert,
  type ForwardPayload,
} from './order-forward'

// ── حمولة مثال (شكل Shopify forwarding من order-forwarding.md) ──
// مهم: affiliateId = الـ slug المولَّد من createTrackingLink (قيمة ?ref).
const SLUG = 'a1b2c3d4e5'

function makePayload(overrides?: Partial<ForwardPayload['order']>): unknown {
  return {
    event: 'order.attributed',
    sentAt: '2026-06-20T12:34:56.000Z',
    shop: 'acme.myshopify.com',
    affiliateId: SLUG,
    order: {
      id: '5123456789012',
      gid: 'gid://shopify/Order/5123456789012',
      number: 1001,
      name: '#1001',
      createdAt: '2026-06-20T12:34:50-00:00',
      currency: 'DZD',
      totalPrice: '4500',
      subtotalPrice: '4500',
      totalTax: '0',
      totalDiscounts: '0',
      totalShipping: '0',
      financialStatus: 'pending',
      note: null,
      noteAttributes: [
        { name: 'full_url', value: `https://acme.myshopify.com/products/earbuds?ref=${SLUG}` },
      ],
      lineItems: [
        {
          title: 'Wireless Earbuds Pro',
          variantTitle: null,
          sku: 'EARBUDS-PRO-01',
          quantity: 2,
          price: '4500',
          productId: '8123456789012',
          variantId: '44086909468806',
        },
      ],
      customer: {
        firstName: 'Test',
        lastName: null,
        email: null,
        phone: '+213558348789',
      },
      shippingAddress: {
        name: 'Test',
        phone: '+213558348789',
        address1: 'Rue Didouche Mourad',
        address2: null,
        city: 'Algiers',
        province: 'Algiers',
        country: 'Algeria',
        countryCode: 'DZ',
        zip: null,
      },
      ...overrides,
    },
  }
}

// ── مزيّف للعقود (DI) — يحاكي قاعدة البيانات في الذاكرة ──
function makeDeps(over?: Partial<AttributionDeps>) {
  const inserted: OrderInsert[] = []
  const deps: AttributionDeps = {
    findTrackingLinkBySlug: async (slug) =>
      slug === SLUG
        ? {
            id: 'link-1',
            affiliateId: 'aff-1',
            affiliateUserId: 'user-aff-1',
            productId: 'prod-1',
          }
        : null,
    findProductById: async (id) =>
      id === 'prod-1'
        ? {
            id: 'prod-1',
            merchantId: 'merch-1',
            merchantPrice: 2000,
            isActive: true,
            name: 'Wireless Earbuds Pro',
            sku: 'EARBUDS-PRO-01',
          }
        : null,
    getPlatformFees: async () => ({ merchant: 50, affiliate: 50 }),
    insertOrder: async (values) => {
      inserted.push(values)
      return { id: 'order-1' }
    },
    ...over,
  }
  return { deps, inserted }
}

describe('processAttributedOrder — النسب الصحيح', () => {
  it('يُسند الطلبية للمسوّق الصحيح ← على المنتج الصحيح ← ومن ثَمّ التاجر الصحيح', async () => {
    const payload = ForwardPayloadSchema.parse(makePayload())
    const { deps, inserted } = makeDeps()

    const result = await processAttributedOrder(payload, deps)

    expect(result).toEqual({ status: 'created', orderId: 'order-1' })
    expect(inserted).toHaveLength(1)
    const row = inserted[0]
    // الهدف النهائي للمهمّة:
    expect(row.affiliate_id).toBe('aff-1') // المسوّق (من رابط التتبّع/الـ slug)
    expect(row.product_id).toBe('prod-1') // المنتج (من رابط التتبّع)
    expect(row.merchant_id).toBe('merch-1') // التاجر (من المنتج)
    expect(row.tracking_link_id).toBe('link-1')
    // idempotency
    expect(row.external_source).toBe('shopify:acme.myshopify.com')
    expect(row.external_order_id).toBe('5123456789012')
    expect(row.status).toBe('pending')
  })

  it('يأخذ الكمّية وسعر الوحدة من سطر الطلب المطابق بالـ SKU', async () => {
    const payload = ForwardPayloadSchema.parse(
      makePayload({
        lineItems: [
          { title: 'Other', sku: 'OTHER-99', quantity: 1, price: '999' },
          { title: 'Earbuds', sku: 'EARBUDS-PRO-01', quantity: 2, price: '4500' },
        ],
      }),
    )
    const { deps, inserted } = makeDeps()

    await processAttributedOrder(payload, deps)

    expect(inserted[0].quantity).toBe(2)
    expect(inserted[0].unit_affiliate_price_dzd).toBe(4500) // سطر EARBUDS لا OTHER
    expect(inserted[0].unit_merchant_price_dzd).toBe(2000)
    expect(inserted[0].platform_fee_dzd).toBe(100)
  })

  it('يطبّع الهاتف الجزائري والعنوان من عنوان الشحن', async () => {
    const payload = ForwardPayloadSchema.parse(makePayload())
    const { deps, inserted } = makeDeps()
    await processAttributedOrder(payload, deps)
    expect(inserted[0].customer_phone).toBe('0558348789')
    expect(inserted[0].customer_wilaya).toBe('Algiers')
    expect(inserted[0].customer_address).toBe('Rue Didouche Mourad')
  })

  it('يتجاهل slug غير معروف بلا إنشاء طلبية', async () => {
    const payload = ForwardPayloadSchema.parse(
      makePayload(),
    )
    // نبدّل الـ slug إلى قيمة غير موجودة
    ;(payload as ForwardPayload).affiliateId = 'unknown-slug'
    const { deps, inserted } = makeDeps()

    const result = await processAttributedOrder(payload, deps)
    expect(result).toEqual({ status: 'ignored', reason: 'unknown_affiliate_link' })
    expect(inserted).toHaveLength(0)
  })

  it('يتجاهل المنتج غير المتاح', async () => {
    const payload = ForwardPayloadSchema.parse(makePayload())
    const { deps, inserted } = makeDeps({
      findProductById: async () => ({
        id: 'prod-1',
        merchantId: 'merch-1',
        merchantPrice: 2000,
        isActive: false, // غير نشط
        name: 'x',
        sku: null,
      }),
    })
    const result = await processAttributedOrder(payload, deps)
    expect(result).toEqual({ status: 'ignored', reason: 'product_unavailable' })
    expect(inserted).toHaveLength(0)
  })

  it('يعامل التعارض (نفس الطلب) كتكرار لا كبيع جديد', async () => {
    const payload = ForwardPayloadSchema.parse(makePayload())
    const { deps } = makeDeps({ insertOrder: async () => null }) // null ⇒ conflict
    const result = await processAttributedOrder(payload, deps)
    expect(result).toEqual({ status: 'duplicate' })
  })

  it('يُشعر المسوّق صاحب النسب عند الإنشاء فقط', async () => {
    const payload = ForwardPayloadSchema.parse(makePayload())
    const notified: string[] = []
    const { deps } = makeDeps({
      notifyNewOrder: async ({ affiliateUserId }) => {
        notified.push(affiliateUserId)
      },
    })
    await processAttributedOrder(payload, deps)
    expect(notified).toEqual(['user-aff-1'])
  })
})

describe('extractCustomer — مصادر بديلة لبيانات الزبون', () => {
  it('يأخذ البيانات من billingAddress عند غياب customer/shipping', async () => {
    const payload = ForwardPayloadSchema.parse(
      makePayload({
        customer: null,
        shippingAddress: null,
        billingAddress: {
          firstName: 'Amine',
          lastName: 'Brahimi',
          phone: '0671122334',
          address1: 'Cité 200 logements',
          city: 'Oran',
          province: 'Oran',
        },
      } as never),
    )
    const { deps, inserted } = makeDeps()
    await processAttributedOrder(payload, deps)
    expect(inserted[0].customer_name).toBe('Amine Brahimi')
    expect(inserted[0].customer_phone).toBe('0671122334')
    expect(inserted[0].customer_wilaya).toBe('Oran')
    expect(inserted[0].customer_address).toBe('Cité 200 logements')
  })

  it('يأخذ البيانات من noteAttributes (EasySell/COD) عند غيابها في الكائنات', async () => {
    const payload = ForwardPayloadSchema.parse(
      makePayload({
        customer: null,
        shippingAddress: null,
        billingAddress: null,
        noteAttributes: [
          { name: 'الاسم الكامل', value: 'سمير علواش' },
          { name: 'رقم الهاتف', value: '+213555667788' },
          { name: 'الولاية', value: 'Constantine' },
          { name: 'البلدية', value: 'El Khroub' },
          { name: 'العنوان', value: 'حي الرياض' },
        ],
      } as never),
    )
    const { deps, inserted } = makeDeps()
    await processAttributedOrder(payload, deps)
    expect(inserted[0].customer_name).toBe('سمير علواش')
    expect(inserted[0].customer_phone).toBe('0555667788')
    expect(inserted[0].customer_wilaya).toBe('Constantine')
    expect(inserted[0].customer_commune).toBe('El Khroub')
    expect(inserted[0].customer_address).toBe('حي الرياض')
  })

  it('يلجأ إلى قيم افتراضية آمنة عند غياب كلّ المصادر (لا حقول فارغة صلبة)', async () => {
    const payload = ForwardPayloadSchema.parse(
      makePayload({
        customer: null,
        shippingAddress: null,
        billingAddress: null,
        noteAttributes: [],
      } as never),
    )
    const { deps, inserted } = makeDeps()
    await processAttributedOrder(payload, deps)
    expect(inserted[0].customer_name).toBe('زبون')
    expect(inserted[0].customer_phone).toBe('غير متوفّر')
    expect(inserted[0].customer_wilaya).toBe('غير محدد')
  })
})

describe('verifyHmac', () => {
  const secret = 'shared-secret'
  const body = JSON.stringify({ hello: 'world' })
  const sig = createHmac('sha256', secret).update(body, 'utf8').digest('base64')

  it('يقبل التوقيع الصحيح', () => {
    expect(verifyHmac(body, sig, secret)).toBe(true)
  })
  it('يرفض توقيعاً خاطئاً أو غائباً', () => {
    expect(verifyHmac(body, 'AAAA', secret)).toBe(false)
    expect(verifyHmac(body, null, secret)).toBe(false)
    expect(verifyHmac(body + 'x', sig, secret)).toBe(false)
  })
})

describe('helpers', () => {
  it('ForwardPayloadSchema يقبل مثال المواصفة', () => {
    expect(() => ForwardPayloadSchema.parse(makePayload())).not.toThrow()
  })
  it('normalizeDzPhone', () => {
    expect(normalizeDzPhone('+213558348789')).toBe('0558348789')
    expect(normalizeDzPhone('00213558348789')).toBe('0558348789')
    expect(normalizeDzPhone('0558348789')).toBe('0558348789')
    expect(normalizeDzPhone(null)).toBeNull()
  })
  it('parseDzd', () => {
    expect(parseDzd('4500')).toBe(4500)
    expect(parseDzd('4500.6')).toBe(4501)
    expect(parseDzd(null)).toBeNull()
    expect(parseDzd('-5')).toBeNull()
  })
  it('pickLineItem يطابق بالـ SKU وإلا الأوّل', () => {
    const items = [
      { sku: 'A', quantity: 1 },
      { sku: 'B', quantity: 1 },
    ] as never
    expect(pickLineItem(items, 'B')).toMatchObject({ sku: 'B' })
    expect(pickLineItem(items, 'Z')).toMatchObject({ sku: 'A' }) // لا تطابق ⇒ الأوّل
    expect(pickLineItem(items, null)).toMatchObject({ sku: 'A' })
  })
})

describe('buildOrderInsert — حالات سعر بديلة', () => {
  it('يستعمل المجموع الفرعي/الكمّية عند غياب سعر السطر', () => {
    const payload = ForwardPayloadSchema.parse(
      makePayload({
        subtotalPrice: '6000',
        lineItems: [{ title: 'x', sku: 'EARBUDS-PRO-01', quantity: 3, price: null }],
      }),
    )
    const row = buildOrderInsert({
      payload,
      link: {
        id: 'link-1',
        affiliateId: 'aff-1',
        affiliateUserId: 'u',
        productId: 'prod-1',
      },
      product: {
        id: 'prod-1',
        merchantId: 'merch-1',
        merchantPrice: 1500,
        isActive: true,
        name: 'x',
        sku: 'EARBUDS-PRO-01',
      },
      fees: { merchant: 50, affiliate: 50 },
    })
    expect(row.quantity).toBe(3)
    expect(row.unit_affiliate_price_dzd).toBe(2000) // 6000 / 3
  })
})
