// ============================================================
// _dashboard/shipments/-server/shipments.api.ts  — Super Admin فقط
//
// لوحة شحنات المنصّة + طباعة الملصق الرسمي من ECOTRACK (Phase 5).
//
// أمان الطباعة (مكافحة الاحتيال):
//   1) تحقّق توقيع HMAC للتوكن + صلاحيته (72 ساعة).
//   2) استخدام مرّة واحدة ذرّيّاً (UPDATE … WHERE label_token_used_at IS NULL).
//   3) جلب ملصق ECOTRACK؛ عند الفشل نحرّر المطالبة كي يُعاد المحاولة.
//   4) سجلّ كل محاولة (نجاح/فشل) في label_print_audit.
// طباعة الملصق الرسمي محصورة بالأدمن — لا يصل ECOTRACK label/PII للتاجر أبداً.
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import {
  orders,
  merchantProfiles,
  affiliateProfiles,
  products,
  orderStatusHistory,
  deliveryOffices,
  labelPrintAudit,
} from '#/server/db/schema'
import { and, eq, isNull, inArray, desc, sql } from 'drizzle-orm'
import { requireSuperAdmin } from '#/server/auth/guards'
import { notify } from '#/server/notify'
import { verifyLabelToken } from '#/server/delivery/label'
import { getEcotrackClient, ecotrackStatusLabel } from '#/server/services/ecotrack.service'
import { syncOrderTracking } from '#/server/delivery/ecotrack-sync'

export interface ShipmentView {
  id: string
  internalShipmentId: string | null
  merchantName: string
  wilaya: string
  deliveryType: 'home' | 'office'
  officeName: string | null
  status: string
  trackingNumber: string | null
  labelPrintedAt: string | null
  createdAt: string
}

// قائمة الشحنات (المشحونة فما فوق) — بلا PII للزبون (لوجستيّة بحتة)
export const getShipments = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ShipmentView[]> => {
    await requireSuperAdmin()

    const rows = await db
      .select({
        id: orders.id,
        internalShipmentId: orders.internal_shipment_id,
        merchantName: merchantProfiles.business_name,
        wilaya: orders.customer_wilaya,
        deliveryType: orders.delivery_type,
        officeName: deliveryOffices.name,
        status: orders.status,
        trackingNumber: orders.tracking_number,
        labelPrintedAt: orders.label_printed_at,
        createdAt: orders.created_at,
      })
      .from(orders)
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .leftJoin(deliveryOffices, eq(orders.delivery_office_id, deliveryOffices.id))
      .where(inArray(orders.status, ['shipped', 'at_wilaya', 'delivered', 'returned']))
      .orderBy(desc(orders.created_at))
      .limit(300)

    return rows.map((r) => ({
      id: r.id,
      internalShipmentId: r.internalShipmentId,
      merchantName: r.merchantName,
      wilaya: r.wilaya,
      deliveryType: r.deliveryType,
      officeName: r.officeName,
      status: r.status,
      trackingNumber: r.trackingNumber,
      labelPrintedAt: r.labelPrintedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  },
)

// ============================================================
// DELETE SHIPMENT (الأدمن) — حذف الطلبية لدى شركة التوصيل قبل الالتقاط فقط.
//
// قاعدة DHD/ECOTRACK: delete/order ينجح فقط ما دامت الشحنة «جاهزة للإرسال»
// (prete_a_expedier) — أي لم تُصدَّق/تُلتقَط بعد. بمجرّد دخولها «في انتظار
// الالتقاط» (en_ramassage) أو ما بعده، يرفض المزوّد الحذف. نحترم هذه القاعدة:
//   1) حارس محلّي سريع على آخر حالة معروفة (delivery_status).
//   2) الحَكَم النهائي = نداء deleteOrder نفسه (يرفضه المزوّد إن التُقطت).
// عند النجاح: نلغي الطلبية محليّاً، نُعيد المخزون، ونُشعِر التاجر والمسوّق.
// ============================================================

// حالات المزوّد التي ما زالت «قابلة للحذف» (قبل الالتقاط)
const DELETABLE_DELIVERY_STATUSES = new Set([
  'pending', // لم تُزامَن بعد (أُنشئت للتوّ)
  'prete_a_expedier', // جاهزة للإرسال
  'order_information_received_by_carrier', // سُجِّلت لدى الناقل (قبل الالتقاط)
])

export const deleteShipmentOrder = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()

    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        tracking: orders.tracking_number,
        accountId: orders.ecotrack_account_id,
        deliveryStatus: orders.delivery_status,
        quantity: orders.quantity,
        productId: orders.product_id,
        merchantId: orders.merchant_id,
        affiliateId: orders.affiliate_id,
      })
      .from(orders)
      .where(eq(orders.id, data.orderId))
      .limit(1)

    if (!order) throw new Error('الطلبية غير موجودة')

    // 1) حارس على حالة المنصّة: لا حذف إلا للطلبيات «المشحونة» الجاهزة للإرسال.
    //    (at_wilaya/delivered/returned = التُقطت/انتهت ⇒ لا حذف)
    if (order.status !== 'shipped') {
      throw new Error(
        'لا يمكن الحذف إلا لطلبية جاهزة للإرسال لم تلتقطها شركة التوصيل بعد',
      )
    }
    if (!order.tracking) {
      throw new Error('هذه الطلبية لم تُسجَّل لدى شركة التوصيل (لا رقم تتبّع)')
    }

    // 2) حارس محلّي سريع على آخر حالة معروفة من المزوّد
    const ds = (order.deliveryStatus ?? 'pending').toLowerCase()
    if (!DELETABLE_DELIVERY_STATUSES.has(ds)) {
      throw new Error(
        'الطلبية تجاوزت مرحلة «الجاهزة للإرسال» (التقطتها شركة التوصيل) — لا يمكن حذفها',
      )
    }

    // 3) الحَكَم النهائي: احذفها لدى المزوّد (يرفض إن التُقطت فعليّاً)
    const client = await getEcotrackClient(order.accountId ?? undefined)
    let deleted
    try {
      deleted = await client.deleteOrder(order.tracking)
    } catch {
      throw new Error(
        'رفضت شركة التوصيل حذف الشحنة — على الأرجح التقطتها بالفعل (لا حذف بعد الالتقاط)',
      )
    }
    if (!deleted.success) {
      throw new Error(
        'رفضت شركة التوصيل حذف الشحنة — قد تكون التقطتها بالفعل',
      )
    }

    // 4) ألغِ الطلبية محليّاً + أعِد المخزون + سجّل + أشعِر (معاملة ذرّية)
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: 'cancelled',
          tracking_number: null,
          internal_shipment_id: null,
          qr_token: null,
          delivery_status: 'annule',
        })
        .where(eq(orders.id, order.id))

      // أعِد الكمية للمخزون (خُصِمت عند تأكيد المسوّق)
      await tx
        .update(products)
        .set({ stock_qty: sql`${products.stock_qty} + ${order.quantity}` })
        .where(eq(products.id, order.productId))

      await tx.insert(orderStatusHistory).values({
        order_id: order.id,
        from_status: 'shipped',
        to_status: 'cancelled',
        occurred_at: new Date(),
        source: 'admin',
        note: 'حذف الأدمن للشحنة قبل الالتقاط لدى شركة التوصيل',
      })
    })

    // إشعارات best-effort للطرفين
    const [merchant] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, order.merchantId))
      .limit(1)
    if (merchant) {
      await notify({
        userId: merchant.userId,
        type: 'order_status',
        title: 'أُلغيت شحنة من الإدارة',
        body: 'حذفت الإدارة شحنة لم تلتقطها شركة التوصيل بعد، وأُعيد المخزون.',
        link: '/merchant/orders',
      })
    }
    if (order.affiliateId) {
      const [aff] = await db
        .select({ userId: affiliateProfiles.user_id })
        .from(affiliateProfiles)
        .where(eq(affiliateProfiles.id, order.affiliateId))
        .limit(1)
      if (aff) {
        await notify({
          userId: aff.userId,
          type: 'order_status',
          title: 'أُلغيت طلبيتك من الإدارة',
          body: 'أُلغيت طلبية قبل التقاطها من شركة التوصيل.',
          link: '/affiliate/orders',
        })
      }
    }

    return { success: true }
  })

type AuditResult =
  | 'success'
  | 'invalid_signature'
  | 'expired'
  | 'already_used'
  | 'ecotrack_error'

async function audit(
  orderId: string,
  actorUserId: string,
  result: AuditResult,
  detail?: string | null,
): Promise<void> {
  await db.insert(labelPrintAudit).values({
    order_id: orderId,
    actor_user_id: actorUserId,
    action: 'print_attempt',
    result,
    detail: detail ?? null,
  })
}

export interface PrintLabelResult {
  pdfBase64: string
  internalShipmentId: string
}

export const printOfficialLabel = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<PrintLabelResult> => {
    const session = await requireSuperAdmin()
    const actorId = session.user.id

    const [order] = await db
      .select({
        id: orders.id,
        qrToken: orders.qr_token,
        internalShipmentId: orders.internal_shipment_id,
        tracking: orders.tracking_number,
        accountId: orders.ecotrack_account_id,
      })
      .from(orders)
      .where(eq(orders.id, data.orderId))
      .limit(1)

    if (!order) throw new Error('الشحنة غير موجودة')
    if (!order.qrToken || !order.tracking || !order.internalShipmentId) {
      throw new Error('هذه الطلبية لم تُشحَن بعد — لا يوجد ملصق')
    }

    // 1) تحقّق التوقيع + الصلاحية
    const v = verifyLabelToken(order.qrToken, Date.now())
    if (!v.ok) {
      const result: AuditResult = v.reason === 'expired' ? 'expired' : 'invalid_signature'
      await audit(order.id, actorId, result, v.reason)
      throw new Error(
        v.reason === 'expired'
          ? 'انتهت صلاحية توكن الملصق (72 ساعة)'
          : 'توكن الملصق غير صالح',
      )
    }

    // 2) مطالبة ذرّية: استخدام مرّة واحدة (منع إعادة الطباعة/التشغيل)
    const claimed = await db
      .update(orders)
      .set({ label_token_used_at: new Date(), label_printed_at: new Date() })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.qr_token, order.qrToken),
          isNull(orders.label_token_used_at),
        ),
      )
      .returning({ id: orders.id })

    if (claimed.length === 0) {
      await audit(order.id, actorId, 'already_used', 'label already printed')
      throw new Error('سبق طباعة ملصق هذه الشحنة (استخدام واحد فقط)')
    }

    // 3) اجلب الملصق الرسمي من ECOTRACK
    let pdfBase64: string
    try {
      const client = await getEcotrackClient(order.accountId ?? undefined)
      const label = await client.getLabel(order.tracking)
      pdfBase64 = label.base64
    } catch (err) {
      // حرّر المطالبة كي يُعاد المحاولة + سجّل الفشل
      await db
        .update(orders)
        .set({ label_token_used_at: null, label_printed_at: null })
        .where(eq(orders.id, order.id))
      await audit(
        order.id,
        actorId,
        'ecotrack_error',
        err instanceof Error ? err.message : 'فشل جلب الملصق',
      )
      throw new Error('تعذّر جلب الملصق الرسمي من شركة التوصيل — حاول مجدداً')
    }

    // 4) نجاح
    await audit(order.id, actorId, 'success', null)
    return { pdfBase64, internalShipmentId: order.internalShipmentId }
  })

// ============================================================
// SCAN QR → MATCH SHIPMENT → VERIFY AT PROVIDER (Phase 5)
//
// الأدمن يمسح رمز QR على الملصق الداخلي للتاجر. محتوى الرمز = توكن HMAC الموقّع
// (ليس معرّف الطلب الخام). نتحقّق من التوقيع، نطابقه بالشحنة عبر internal_shipment_id،
// ثم نؤكّد وجود الشحنة فعليّاً لدى شركة التوصيل عبر get/tracking/info — لا بيانات
// وهميّة ولا أرقام تتبّع مُختلَقة. قراءة فقط (لا تُغيّر الحالة).
// ============================================================

export interface ScanMatchResult {
  matched: boolean
  reason?: 'malformed' | 'invalid_signature' | 'expired' | 'not_found'
  order?: {
    id: string
    internalShipmentId: string | null
    merchantName: string
    wilaya: string
    deliveryType: 'home' | 'office'
    officeName: string | null
    status: string
    trackingNumber: string | null
    labelPrintedAt: string | null
  }
  provider?: {
    exists: boolean
    rawStatus: string | null
    statusLabel: string | null
    currentStation: string | null
  }
}

export const verifyShipmentByQr = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<ScanMatchResult> => {
    await requireSuperAdmin()

    // 1) تحقّق التوقيع + الصلاحية (نفس آلية الملصق الرسمي)
    const v = verifyLabelToken(data.token, Date.now())
    if (!v.ok) return { matched: false, reason: v.reason }

    // 2) طابق الشحنة عبر المرجع الداخلي الموقّع
    const [order] = await db
      .select({
        id: orders.id,
        internalShipmentId: orders.internal_shipment_id,
        merchantName: merchantProfiles.business_name,
        wilaya: orders.customer_wilaya,
        deliveryType: orders.delivery_type,
        officeName: deliveryOffices.name,
        status: orders.status,
        tracking: orders.tracking_number,
        accountId: orders.ecotrack_account_id,
        labelPrintedAt: orders.label_printed_at,
      })
      .from(orders)
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .leftJoin(deliveryOffices, eq(orders.delivery_office_id, deliveryOffices.id))
      .where(eq(orders.internal_shipment_id, v.internalShipmentId))
      .limit(1)

    if (!order) return { matched: false, reason: 'not_found' }

    // 3) أكّد وجود الشحنة فعليّاً لدى شركة التوصيل (قراءة فقط — لا اختلاق)
    let provider: ScanMatchResult['provider'] = {
      exists: false,
      rawStatus: null,
      statusLabel: null,
      currentStation: null,
    }
    if (order.tracking) {
      try {
        const client = await getEcotrackClient(order.accountId ?? undefined)
        const info = await client.getTrackingInfo(order.tracking)
        const acts = (info.activity ?? [])
          .filter((a) => a.status && a.date)
          .sort((a, b) => `${b.date}T${b.time ?? ''}`.localeCompare(`${a.date}T${a.time ?? ''}`))
        const latest = acts[0]
        provider = {
          exists: true,
          rawStatus: latest?.status ?? null,
          statusLabel: latest?.status ? ecotrackStatusLabel(latest.status) : null,
          currentStation: info.currentStation ?? null,
        }
      } catch {
        provider = { exists: false, rawStatus: null, statusLabel: null, currentStation: null }
      }
    }

    return {
      matched: true,
      order: {
        id: order.id,
        internalShipmentId: order.internalShipmentId,
        merchantName: order.merchantName,
        wilaya: order.wilaya,
        deliveryType: order.deliveryType,
        officeName: order.deliveryType === 'office' ? order.officeName : null,
        status: order.status,
        trackingNumber: order.tracking,
        labelPrintedAt: order.labelPrintedAt?.toISOString() ?? null,
      },
      provider,
    }
  })

// ============================================================
// CONFIRM RECEPTION BY DELIVERY COMPANY (Phase 5)
//
// «تأكيد استلام شركة التوصيل» = سحب الحالة الحقيقية من ECOTRACK وتطبيقها
// (syncOrderTracking). لا نختلق حالة: المنصّة تتقدّم فقط بحالة حقيقية من المزوّد.
// نُسجّل المحاولة في label_print_audit للتدقيق.
// ============================================================

export interface ConfirmReceptionResult {
  orderId: string
  trackingNumber: string
  deliveryStatus: string | null
  deliveryStatusLabel: string | null
  status: string
  eventsApplied: number
}

export const confirmShipmentReceived = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<ConfirmReceptionResult> => {
    const session = await requireSuperAdmin()

    const [order] = await db
      .select({ id: orders.id, tracking: orders.tracking_number })
      .from(orders)
      .where(eq(orders.id, data.orderId))
      .limit(1)
    if (!order) throw new Error('الشحنة غير موجودة')
    if (!order.tracking) throw new Error('لا يوجد رقم تتبّع — لم تُسجَّل الشحنة لدى شركة التوصيل بعد')

    // اسحب وطبّق الحالة الحقيقية من المزوّد (لا اختلاق حالة)
    const result = await syncOrderTracking(data.orderId)

    await db.insert(labelPrintAudit).values({
      order_id: data.orderId,
      actor_user_id: session.user.id,
      action: 'reception_check',
      result: 'success',
      detail: `delivery_status=${result.deliveryStatus ?? '∅'} platform_status=${result.status} events=${result.eventsApplied}`,
    })

    return {
      orderId: result.orderId,
      trackingNumber: result.trackingNumber,
      deliveryStatus: result.deliveryStatus,
      deliveryStatusLabel: result.deliveryStatus ? ecotrackStatusLabel(result.deliveryStatus) : null,
      status: result.status,
      eventsApplied: result.eventsApplied,
    }
  })
