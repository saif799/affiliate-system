// merchant/orders/-server/orders.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import {
  orders,
  orderStatusHistory,
  products,
  deliveryAccounts,
  deliveryOffices,
} from '#/server/db/schema'
import { and, eq, sql, desc, notInArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { getEcotrackClient } from '#/server/services/ecotrack.service'
import { requireMerchant } from '#/server/auth/guards'
import { toMerchantOrderView } from '#/server/privacy/order-views'
import { notifySuperAdmins } from '#/server/notify'
import { generateInternalShipmentId, issueLabelToken, decideShipClaim } from '#/server/delivery/label'
import QRCode from 'qrcode'
import type {
  MerchantOrdersData,
  Order,
  OrderStatus,
  DbOrderStatus,
} from '../-orders.types'

// ============================================================
// HELPERS
// ============================================================

const STATUS_MAP: Record<DbOrderStatus, OrderStatus | null> = {
  pending: 'pending',
  confirmed: 'pending',
  shipped: 'shipped',
  at_wilaya: 'shipped',
  delivered: 'delivered',
  returned: 'returned',
  cancelled: null,
  disputed: null,
}

const n = (v: unknown) => Number(v ?? 0)

// ============================================================
// GET ORDERS
// ============================================================

export const getMerchantOrders = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MerchantOrdersData> => {
    const { profileId } = await requireMerchant()

    // التاجر يرى فقط الطلبيات التي أكّدها المسوّق (confirmed فما فوق)
    // الطلبيات pending قيد قرار المسوّق، والملغاة/المتنازَع عليها مخفية
    const visible = and(
      eq(orders.merchant_id, profileId),
      notInArray(orders.status, ['pending', 'cancelled', 'disputed']),
    )

    // ⚠️ لا نسحب أيّ PII للزبون (الاسم/الهاتف/العنوان/البلدية/الملاحظة).
    // اسم المكتب يأتي من delivery_offices (ليس PII) ويظهر للتوصيل المكتبي فقط.
    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.created_at,
        productName: products.name,
        wilaya: orders.customer_wilaya,
        deliveryType: orders.delivery_type,
        officeName: deliveryOffices.name,
        quantity: orders.quantity,
        unitAffiliate: orders.unit_affiliate_price_dzd,
        unitMerchant: orders.unit_merchant_price_dzd,
        feeMerchant: orders.platform_fee_merchant_dzd,
        status: orders.status,
        trackingNumber: orders.tracking_number,
        internalShipmentId: orders.internal_shipment_id,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .leftJoin(deliveryOffices, eq(orders.delivery_office_id, deliveryOffices.id))
      .where(visible)
      .orderBy(desc(orders.created_at))

    // التعقيم عبر طبقة الخصوصية (دفاع عميق — لا تخرج PII للتاجر أبداً)
    const ordersList: Order[] = rows.map((r) =>
      toMerchantOrderView({
        id: r.id,
        createdAt: r.createdAt,
        productName: r.productName,
        productVariant: '',
        wilaya: r.wilaya,
        deliveryType: r.deliveryType,
        officeName: r.officeName,
        quantity: r.quantity,
        totalPrice: r.unitAffiliate * r.quantity,
        merchantEarnings: Math.max(0, r.unitMerchant * r.quantity - r.feeMerchant),
        status: STATUS_MAP[r.status as DbOrderStatus] ?? 'pending',
        dbStatus: r.status as DbOrderStatus,
        trackingNumber: r.trackingNumber,
        internalShipmentId: r.internalShipmentId,
      }),
    )

    const [counts] = await db
      .select({
        all: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'confirmed')`,
        shipped: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('shipped', 'at_wilaya'))`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
      })
      .from(orders)
      .where(visible)

    return {
      orders: ordersList,
      tabCounts: {
        all: n(counts.all),
        pending: n(counts.pending),
        shipped: n(counts.shipped),
        delivered: n(counts.delivered),
        returned: n(counts.returned),
      },
    }
  },
)

// ============================================================
// SHIP ORDER — ينشئ الشحنة في ECOTRACK بضغطة واحدة (بلا إدخال يدوي)
//
// التاجر يملك إجراءً واحداً: شحن الطلبية المؤكَّدة (confirmed → shipped).
// عند الشحن نُنشئ الطلبية فعليّاً لدى شركة التوصيل (create/order) ونخزّن رقم
// التتبّع العائد منها. ما بعد الشحن (at_wilaya/delivered/returned) مصدره
// مزامنة ECOTRACK (cron) — لا يتحكّم به التاجر.
// ============================================================

// حساب التوصيل الافتراضي المُفعَّل (إن وُجد) — وإلّا نعتمد على API_DHD من البيئة
async function getDefaultDeliveryAccountId(): Promise<string | undefined> {
  const [acct] = await db
    .select({ id: deliveryAccounts.id })
    .from(deliveryAccounts)
    .where(
      and(
        eq(deliveryAccounts.provider, 'ecotrack'),
        eq(deliveryAccounts.is_default, true),
        eq(deliveryAccounts.is_active, true),
        isNull(deliveryAccounts.deleted_at),
      ),
    )
    .limit(1)
  return acct?.id
}

const ShipSchema = z.object({ orderId: z.string().uuid() })

// يحرّر «المطالبة» (claim) عند فشل الإنشاء لدى ECOTRACK كي يُعاد المحاولة لاحقاً.
async function releaseShipClaim(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ internal_shipment_id: null, qr_token: null })
    .where(eq(orders.id, orderId))
}

// ============================================================
// SHIP ORDER — آمن للتزامن وقابل للتكرار (Phase 4)
//
// منع التكرار بثلاث طبقات:
//  1) قفل صفّ + شرط (status='confirmed' و internal_shipment_id IS NULL):
//     «مطالبة» ذرّية — نداء متزامن ثانٍ لا يمرّ.
//  2) إن وُجد رقم تتبّع سلفاً ⇒ نعيده دون إنشاء جديد (idempotent عند التحديث/النقر المزدوج).
//  3) reference=order.id لدى ECOTRACK (إزالة تكرار من جهة الناقل أيضاً).
// نداء ECOTRACK يتمّ خارج القفل؛ عند الفشل نحرّر المطالبة وتبقى الطلبية confirmed.
// ============================================================

export const shipOrder = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ShipSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; tracking: string }> => {
    const { profileId } = await requireMerchant()
    const accountId = await getDefaultDeliveryAccountId()

    // 1) المطالبة الذرّية: اقفل الصفّ، تحقّق، واحجز عبر internal_shipment_id + qr_token.
    const claim = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          id: orders.id,
          status: orders.status,
          existingTracking: orders.tracking_number,
          internalShipmentId: orders.internal_shipment_id,
          qrToken: orders.qr_token,
          customerName: orders.customer_name,
          customerPhone: orders.customer_phone,
          wilaya: orders.customer_wilaya,
          wilayaCode: orders.customer_wilaya_code,
          commune: orders.customer_commune,
          address: orders.customer_address,
          note: orders.customer_note,
          qty: orders.quantity,
          affiliatePrice: orders.unit_affiliate_price_dzd,
          deliveryType: orders.delivery_type,
          productName: products.name,
        })
        .from(orders)
        .innerJoin(products, eq(orders.product_id, products.id))
        .where(and(eq(orders.id, data.orderId), eq(orders.merchant_id, profileId)))
        .for('update')
        .limit(1)

      if (!order) throw new Error('الطلبية غير موجودة')

      const decision = decideShipClaim({
        status: order.status,
        trackingNumber: order.existingTracking,
        internalShipmentId: order.internalShipmentId,
        qrToken: order.qrToken,
        nowMs: Date.now(),
      })

      // مشحونة سلفاً ⇒ idempotent: أعِد رقم التتبّع دون إنشاء شحنة جديدة
      if (decision.action === 'already') {
        return { kind: 'already' as const, tracking: decision.tracking }
      }
      if (decision.action === 'bad_status') {
        throw new Error('لا يمكن شحن إلا طلبية مؤكَّدة')
      }
      // نداء متزامن يُنشئ الشحنة الآن ⇒ احجبه (يمنع شحنتين لنفس الطلب)
      if (decision.action === 'in_flight') {
        throw new Error('جارٍ إنشاء الشحنة بالفعل — حدّث الصفحة بعد لحظات')
      }
      if (!order.wilayaCode || !order.commune) {
        throw new Error(
          'بيانات التوصيل ناقصة (الولاية/البلدية) — هذه طلبية قديمة؛ أعد إنشاءها باختيار منطقة صالحة',
        )
      }

      // إصلاح H1 — استئناف مطالبة عالقة بعد تعطّل (بين إنشاء الشحنة لدى ECOTRACK
      // وحفظ رقم التتبّع): أعِد استخدام نفس المرجع الداخلي وجدّد التوكن (يُعيد
      // تسليح حارس in_flight ذرّيّاً داخل القفل). إعادة createOrder آمنة لأن
      // ECOTRACK يُزيل التكرار عبر reference=order.id.
      if (decision.action === 'resume') {
        const internalShipmentId = order.internalShipmentId!
        const renewed = issueLabelToken(internalShipmentId, Date.now())
        await tx.update(orders).set({ qr_token: renewed }).where(eq(orders.id, order.id))
        return { kind: 'claimed' as const, order, internalShipmentId }
      }

      // fresh: احجز مطالبة جديدة. بعد هذا التحديث لا يمرّ نداء متزامن آخر
      // (internal_shipment_id لم يعد NULL ومطالبته حديثة ⇒ in_flight).
      const issuedAt = Date.now()
      const internalShipmentId = generateInternalShipmentId()
      const qrToken = issueLabelToken(internalShipmentId, issuedAt)

      await tx
        .update(orders)
        .set({ internal_shipment_id: internalShipmentId, qr_token: qrToken })
        .where(eq(orders.id, order.id))

      return { kind: 'claimed' as const, order, internalShipmentId }
    })

    if (claim.kind === 'already') {
      return { success: true, tracking: claim.tracking }
    }

    const { order } = claim
    // تضييق الأنواع بعد حدود المعاملة (مضمونة داخل tx، ودفاع إضافي هنا)
    if (!order.commune || !order.wilayaCode) {
      await releaseShipClaim(order.id)
      throw new Error('بيانات التوصيل ناقصة (الولاية/البلدية)')
    }

    // 2) إنشاء الشحنة لدى ECOTRACK (خارج القفل) — stop_desk حسب نوع التوصيل
    let client
    try {
      client = await getEcotrackClient(accountId)
    } catch {
      await releaseShipClaim(order.id)
      throw new Error('لا يوجد حساب توصيل مُفعَّل — أضِف مفتاح ECOTRACK من الإعدادات')
    }

    const montant = order.affiliatePrice * order.qty // COD = سعر البيع × الكمية

    let tracking: string | undefined
    try {
      const res = await client.createOrder({
        reference: order.id, // مفتاح إزالة التكرار لدى ECOTRACK
        nom_client: order.customerName,
        telephone: order.customerPhone,
        adresse: order.address?.trim() || `${order.commune}، ${order.wilaya}`,
        commune: order.commune,
        code_wilaya: order.wilayaCode,
        montant,
        produit: order.productName,
        remarque: order.note ?? undefined,
        quantite: order.qty,
        type: 1, // توصيل
        stop_desk: order.deliveryType === 'office' ? 1 : 0, // مكتب/منزل
      })
      tracking = res.tracking
    } catch (err) {
      await releaseShipClaim(order.id) // حرّر المطالبة ⇒ تبقى confirmed وقابلة لإعادة الشحن
      // لا نُسرّب رسائل DHD الخام (Laravel/أسماء حقول) للتاجر — نسجّلها داخلياً فقط
      console.error('[ship] ECOTRACK createOrder failed:', err)
      throw new Error('تعذّر إنشاء الشحنة لدى شركة التوصيل — تحقّق من بيانات التوصيل وحاول مجدداً')
    }

    if (!tracking) {
      await releaseShipClaim(order.id)
      throw new Error('لم تُرجِع شركة التوصيل رقم تتبّع — حاول مجدداً')
    }

    // 3) الإنهاء الذرّي: shipped + رقم التتبّع + سجلّ الحالة
    const now = new Date()
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: 'shipped',
          shipped_at: now,
          tracking_number: tracking,
          ecotrack_account_id: accountId ?? null,
          delivery_status: 'pending',
        })
        .where(eq(orders.id, order.id))

      await tx.insert(orderStatusHistory).values({
        order_id: order.id,
        from_status: 'confirmed',
        to_status: 'shipped',
        occurred_at: now,
        source: 'merchant',
      })
    })

    // 4) أشعِر الأدمن: الشحنة مُسجَّلة وجاهزة لطباعة الملصق الرسمي (Phase 5)
    await notifySuperAdmins({
      type: 'system',
      title: 'شحنة جديدة جاهزة للطباعة 🏷️',
      body: `الشحنة ${claim.internalShipmentId} (${order.wilaya}) — اطبع الملصق الرسمي`,
      link: '/shipments',
    })

    return { success: true, tracking }
  })

// ============================================================
// INTERNAL LABEL — الملصق الداخلي للتاجر (Phase 5)
//
// يحوي: المرجع الداخلي + رمز QR للتوكن الموقّع + نوع التوصيل + المكتب +
// الولاية + وقت الإنشاء. بلا أيّ PII للزبون وبلا أيّ بيانات ECOTRACK.
// رمز QR يُولَّد على الخادم (data URL) فلا يحتاج العميل أيّ مكتبة.
// ============================================================

export interface InternalLabelData {
  internalShipmentId: string
  qrDataUrl: string
  deliveryType: 'home' | 'office'
  officeName: string | null
  wilaya: string
  createdAt: string
}

export const getInternalLabel = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<InternalLabelData> => {
    const { profileId } = await requireMerchant()

    const [order] = await db
      .select({
        internalShipmentId: orders.internal_shipment_id,
        qrToken: orders.qr_token,
        deliveryType: orders.delivery_type,
        officeName: deliveryOffices.name,
        wilaya: orders.customer_wilaya,
        createdAt: orders.created_at,
      })
      .from(orders)
      .leftJoin(deliveryOffices, eq(orders.delivery_office_id, deliveryOffices.id))
      .where(and(eq(orders.id, data.orderId), eq(orders.merchant_id, profileId)))
      .limit(1)

    if (!order) throw new Error('الطلبية غير موجودة')
    if (!order.internalShipmentId || !order.qrToken) {
      throw new Error('هذه الطلبية لم تُشحَن بعد — لا يوجد ملصق داخلي')
    }

    // رمز QR يُرمّز التوكن الموقّع (ليس معرّف الطلب الخام)
    const qrDataUrl = await QRCode.toDataURL(order.qrToken, { margin: 1, width: 240 })

    return {
      internalShipmentId: order.internalShipmentId,
      qrDataUrl,
      deliveryType: order.deliveryType,
      officeName: order.deliveryType === 'office' ? (order.officeName ?? null) : null,
      wilaya: order.wilaya,
      createdAt: order.createdAt.toISOString(),
    }
  })
