// src/server/delivery/tracking.api.ts
//
// دوال خادم مشتركة لتتبّع الطلبيات (موجّهة بالدور):
//   - getOrderTracking: أحداث التتبّع لطلبية (مع تحقّق ملكية حسب الدور)
//   - requestOrderReturn: طلب استرجاع (التاجر فقط، خلال 48 ساعة من التسليم)

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  orders,
  orderTrackingEvents,
  orderComments,
  affiliateProfiles,
  merchantProfiles,
  deliveryOffices,
  users,
} from '#/server/db/schema'
import { and, eq, desc, asc } from 'drizzle-orm'
import { z } from 'zod'
import { getEcotrackClient } from '#/server/services/ecotrack.service'

export interface TrackingEventView {
  id: string
  status: string
  statusLabel: string
  description: string | null
  wilaya: string | null
  occurredAt: string
}

// يتحقّق أنّ للمستخدم الحالي حقّ رؤية الطلبية ويُرجِع معرّفها الموثّق
async function authorizeOrderAccess(orderId: string): Promise<string> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  const role = session.user.role

  if (role === 'super_admin') {
    const [o] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!o) throw new Error('الطلبية غير موجودة')
    return o.id
  }

  if (role === 'affiliate') {
    const [o] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(affiliateProfiles, eq(orders.affiliate_id, affiliateProfiles.id))
      .where(and(eq(orders.id, orderId), eq(affiliateProfiles.user_id, session.user.id)))
      .limit(1)
    if (!o) throw new Error('غير مصرّح بعرض هذه الطلبية')
    return o.id
  }

  if (role === 'merchant') {
    const [o] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .where(and(eq(orders.id, orderId), eq(merchantProfiles.user_id, session.user.id)))
      .limit(1)
    if (!o) throw new Error('غير مصرّح بعرض هذه الطلبية')
    return o.id
  }

  throw new Error('Unauthorized')
}

export const getOrderTracking = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<TrackingEventView[]> => {
    const orderId = await authorizeOrderAccess(data.orderId)

    const rows = await db
      .select({
        id: orderTrackingEvents.id,
        status: orderTrackingEvents.status,
        statusLabel: orderTrackingEvents.status_label,
        description: orderTrackingEvents.description,
        wilaya: orderTrackingEvents.wilaya,
        occurredAt: orderTrackingEvents.occurred_at,
      })
      .from(orderTrackingEvents)
      .where(eq(orderTrackingEvents.order_id, orderId))
      .orderBy(desc(orderTrackingEvents.occurred_at))

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      statusLabel: r.statusLabel,
      description: r.description,
      wilaya: r.wilaya,
      occurredAt: r.occurredAt.toISOString(),
    }))
  })

export const requestOrderReturn = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({ orderId: z.string().uuid(), reason: z.string().trim().min(1).max(300) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const session = await getSession()
    if (!session || session.user.role !== 'merchant') throw new Error('Unauthorized')

    const [order] = await db
      .select({
        id: orders.id,
        tracking: orders.tracking_number,
        status: orders.status,
        deliveredAt: orders.delivered_at,
        accountId: orders.ecotrack_account_id,
      })
      .from(orders)
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .where(and(eq(orders.id, data.orderId), eq(merchantProfiles.user_id, session.user.id)))
      .limit(1)

    if (!order) throw new Error('غير مصرّح')
    if (order.status !== 'delivered')
      throw new Error('لا يمكن طلب استرجاع إلا لطلبية مُسلَّمة')
    if (!order.tracking) throw new Error('لا يوجد رقم تتبّع لهذه الطلبية')
    if (order.deliveredAt) {
      const hours = (Date.now() - order.deliveredAt.getTime()) / 3_600_000
      if (hours > 48) throw new Error('انتهت مهلة طلب الاسترجاع (48 ساعة)')
    }

    const client = await getEcotrackClient(order.accountId ?? undefined)
    // ECOTRACK لا يقبل سبب الإرجاع في نقطته (ask/for/order/return) — نُرفق السبب
    // كملاحظة على الشحنة (best-effort) ثم نطلب الإرجاع، ونخزّن السبب محليّاً.
    await client.addTrackingNote(order.tracking, `سبب الإرجاع: ${data.reason}`).catch(() => {})
    await client.requestReturn(order.tracking)
    await db
      .update(orders)
      .set({ return_reason: data.reason })
      .where(eq(orders.id, order.id))
    return { success: true }
  })

// ============================================================
// تفاصيل التوصيل: المكتب (من الجداول المحلّية) + عامل التوصيل/المحطة (حيّ من ECOTRACK)
// ============================================================

// ملاحظة/تعليق كتبه عامل التوصيل أو مكتب التوصيل على الشحنة
export interface CarrierNote {
  at: string // ISO
  text: string
  by: string | null // اسم الموزّع/المحطة إن توفّر
}

export interface OrderDeliveryDetails {
  deliveryType: 'home' | 'office'
  address: string | null
  commune: string | null
  wilaya: string | null
  trackingNumber: string | null
  office: {
    name: string
    postalCode: string | null
    hasStopDesk: boolean
  } | null
  // معلومات حيّة من شركة التوصيل (best-effort — قد لا تتوفّر)
  driver: string | null
  driverPhone: string | null
  currentStation: string | null
  // ملاحظات/تعليقات عامل التوصيل والمكتب (من سجلّ نشاط ECOTRACK)
  carrierNotes: CarrierNote[]
}

// استخراج نصّ ملاحظة من عنصر نشاط ECOTRACK (لا يكون مجرّد رمز حالة)
function extractNote(a: Record<string, unknown>): string | null {
  for (const k of ['reason', 'details', 'content', 'note', 'comment', 'remarque']) {
    const v = a[k]
    if (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== String(a.status).toLowerCase())
      return v.trim()
  }
  return null
}

function extractPhone(a: Record<string, unknown>): string | null {
  for (const k of ['driver_phone', 'phone', 'tel', 'telephone', 'livreur_phone', 'driverPhone']) {
    const v = a[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

export const getOrderDeliveryDetails = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<OrderDeliveryDetails> => {
    const orderId = await authorizeOrderAccess(data.orderId)

    const [o] = await db
      .select({
        deliveryType: orders.delivery_type,
        address: orders.customer_address,
        commune: orders.customer_commune,
        wilaya: orders.customer_wilaya,
        officeId: orders.delivery_office_id,
        tracking: orders.tracking_number,
        accountId: orders.ecotrack_account_id,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!o) throw new Error('الطلبية غير موجودة')

    let office: OrderDeliveryDetails['office'] = null
    if (o.officeId) {
      const [off] = await db
        .select({
          name: deliveryOffices.name,
          postalCode: deliveryOffices.address,
          hasStopDesk: deliveryOffices.has_stop_desk,
        })
        .from(deliveryOffices)
        .where(eq(deliveryOffices.id, o.officeId))
        .limit(1)
      if (off)
        office = {
          name: off.name,
          postalCode: off.postalCode,
          hasStopDesk: off.hasStopDesk,
        }
    }

    // عامل التوصيل + المحطة + ملاحظات الشحنة — من get/tracking/info الحيّ (best-effort)
    let driver: string | null = null
    let driverPhone: string | null = null
    let currentStation: string | null = null
    const carrierNotes: CarrierNote[] = []
    if (o.tracking) {
      try {
        const client = await getEcotrackClient(o.accountId ?? undefined)
        // سباق مع مهلة — كي لا تتعلّق بطاقة التوصيل إن كانت شركة التوصيل بطيئة
        const info = await Promise.race([
          client.getTrackingInfo(o.tracking),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('tracking timeout')), 6000),
          ),
        ])
        currentStation =
          typeof info.currentStation === 'string' ? info.currentStation : null
        const acts = Array.isArray(info.activity) ? info.activity : []
        const seen = new Set<string>()
        for (let i = acts.length - 1; i >= 0; i--) {
          const a = acts[i] as Record<string, unknown>
          // آخر نشاط يحمل اسم موزّع = الموزّع الحالي
          if (!driver && typeof a.driver === 'string' && a.driver.trim()) {
            driver = a.driver.trim()
            driverPhone = extractPhone(a)
          }
          if (!currentStation && typeof a.station === 'string' && a.station.trim()) {
            currentStation = a.station.trim()
          }
          // ملاحظات عامل التوصيل/المكتب على الشحنة
          const text = extractNote(a)
          if (text && !seen.has(text)) {
            seen.add(text)
            const date = typeof a.date === 'string' ? a.date : ''
            const time = typeof a.time === 'string' ? a.time : ''
            const at = date ? new Date(`${date}T${time || '00:00:00'}`) : null
            carrierNotes.push({
              at: at && !Number.isNaN(at.getTime()) ? at.toISOString() : '',
              text,
              by:
                (typeof a.driver === 'string' && a.driver.trim()) ||
                (typeof a.station === 'string' && a.station.trim()) ||
                null,
            })
          }
        }
      } catch {
        /* تجاهل — شركة التوصيل قد لا تُرجِع تفاصيل الموزّع */
      }
    }

    return {
      deliveryType: o.deliveryType,
      address: o.address,
      commune: o.commune,
      wilaya: o.wilaya,
      trackingNumber: o.tracking,
      office,
      driver,
      driverPhone,
      currentStation,
      // الأحدث أولاً (تأكيد صريح بغضّ النظر عن ترتيب نشاط ECOTRACK)
      carrierNotes: carrierNotes
        .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
        .slice(0, 12),
    }
  })

// ============================================================
// تعليقات الطلبية — خيط محادثة (مسوّق/تاجر/أدمن لهم حق الوصول)
// ============================================================

export interface OrderCommentView {
  id: string
  authorName: string
  authorRole: string
  body: string
  createdAt: string
  isMine: boolean
}

export const getOrderComments = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<OrderCommentView[]> => {
    const orderId = await authorizeOrderAccess(data.orderId)
    const session = await getSession()

    const rows = await db
      .select({
        id: orderComments.id,
        authorUserId: orderComments.author_user_id,
        authorRole: orderComments.author_role,
        authorName: users.name,
        body: orderComments.body,
        createdAt: orderComments.created_at,
      })
      .from(orderComments)
      .innerJoin(users, eq(users.id, orderComments.author_user_id))
      .where(eq(orderComments.order_id, orderId))
      .orderBy(asc(orderComments.created_at))

    return rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      authorRole: r.authorRole,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      isMine: r.authorUserId === session?.user.id,
    }))
  })

export const addOrderComment = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        body: z.string().trim().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const orderId = await authorizeOrderAccess(data.orderId)
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    await db.insert(orderComments).values({
      order_id: orderId,
      author_user_id: session.user.id,
      author_role: session.user.role as 'super_admin' | 'merchant' | 'affiliate',
      body: data.body.trim(),
    })

    return { success: true }
  })
