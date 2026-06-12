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
  affiliateProfiles,
  merchantProfiles,
} from '#/server/db/schema'
import { and, eq, desc } from 'drizzle-orm'
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
