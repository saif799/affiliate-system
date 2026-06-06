// ============================================================
// src/server/delivery/ecotrack-sync.ts  — SERVER ONLY
//
// قلب تكامل ECOTRACK: تطبيق أحداث التتبّع على الطلبية.
// المصدر الوحيد للحالات ما بعد الشحن (at_wilaya/delivered/returned).
//
// - يسجّل كل حدث في order_tracking_events (idempotent).
// - يُحدّث orders.delivery_status (حالة ECOTRACK الخام) دائماً.
// - يُقدّم حالة المنصّة (status) للأمام فقط، من حالة نشطة.
// - "livre" → يُرجِع shouldPayout (التسوية تتم عبر processPayout).
// - "retourne" → يضبط returned_at ويُعيد حساب نسبة الرفض.
// ============================================================

import { db } from '#/server/db'
import {
  orders,
  orderTrackingEvents,
  products,
  affiliateProfiles,
  merchantProfiles,
} from '#/server/db/schema'
import { eq } from 'drizzle-orm'
import { recomputeRefusalRateTx } from '#/server/settlement'
import { notify } from '#/server/notify'
import {
  ecotrackStatusLabel,
  getEcotrackClient
  
} from '#/server/services/ecotrack.service'
import type {EcotrackStatus} from '#/server/services/ecotrack.service';
import { processPayout } from '#/server/services/payout.service'

type PlatformTarget = 'shipped' | 'at_wilaya' | 'delivered' | 'returned' | null

// حالة منصّتنا الهدف لكل حالة ECOTRACK (null = سجّل الحدث فقط)
const ECOTRACK_TO_PLATFORM: Record<EcotrackStatus, PlatformTarget> = {
  en_attente: null,
  pris_en_charge: 'shipped',
  en_transit: 'shipped',
  en_cours_livraison: 'at_wilaya',
  livre: 'delivered',
  retourne: 'returned',
  retourne_paye: null, // مُرتجَعة مدفوعة → سجّل فقط (الحالة returned سلفاً)
  echec_livraison: null, // فشل تسليم → ستُعاد المحاولة، لا تغيّر الحالة
  annule: null, // ملغى → يقرّره الأدمن، لا أثر مالي تلقائي
}

export function ecotrackToPlatformStatus(raw: string): PlatformTarget {
  return ECOTRACK_TO_PLATFORM[raw as EcotrackStatus] ?? null
}

// رتبة الحالة — للتقدّم للأمام فقط (نمنع التراجع عند وصول أحداث خارج الترتيب)
const RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  at_wilaya: 3,
  delivered: 4,
  returned: 4,
  cancelled: 5,
  disputed: 5,
}

const ACTIVE_STATUSES = new Set(['confirmed', 'shipped', 'at_wilaya'])

export interface EcotrackEventInput {
  trackingNumber: string
  rawStatus: string
  occurredAt: Date
  description?: string
  wilaya?: string
}

export type EcotrackEventResult =
  | { ok: false; reason: 'not_found' }
  | {
      ok: true
      orderId: string
      from: string
      to: string
      changed: boolean
      shouldPayout: boolean
    }

/** يطبّق حدث ECOTRACK واحداً على الطلبية المطابقة لرقم التتبّع */
export async function applyEcotrackEvent(
  input: EcotrackEventInput,
): Promise<EcotrackEventResult> {
  const label = ecotrackStatusLabel(input.rawStatus)
  const target = ecotrackToPlatformStatus(input.rawStatus)

  const outcome = await db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: orders.id,
        status: orders.status,
        affiliateId: orders.affiliate_id,
      })
      .from(orders)
      .where(eq(orders.tracking_number, input.trackingNumber))
      .for('update')
      .limit(1)

    if (!order) return { kind: 'not_found' as const }

    // 1) سجّل الحدث (idempotent عبر الفهرس الفريد order_id+status+occurred_at)
    await tx
      .insert(orderTrackingEvents)
      .values({
        order_id: order.id,
        status: input.rawStatus,
        status_label: label,
        description: input.description ?? null,
        wilaya: input.wilaya ?? null,
        occurred_at: input.occurredAt,
      })
      .onConflictDoNothing()

    // 2) خزّن حالة ECOTRACK الخام دائماً
    await tx
      .update(orders)
      .set({ delivery_status: input.rawStatus })
      .where(eq(orders.id, order.id))

    const from = order.status

    // 3) تقدّم حالة المنصّة (للأمام فقط، من حالة نشطة)
    let applied: PlatformTarget = null
    if (
      target &&
      ACTIVE_STATUSES.has(from) &&
      (target === 'returned' || RANK[target] > RANK[from])
    ) {
      applied = target
      const now = input.occurredAt
      const patch: Record<string, unknown> = { status: target }
      if (target === 'shipped') patch.shipped_at = now
      if (target === 'at_wilaya') patch.at_wilaya_at = now
      if (target === 'delivered') patch.delivered_at = now
      if (target === 'returned') patch.returned_at = now
      await tx.update(orders).set(patch).where(eq(orders.id, order.id))

      // المرتجَع: لا تسوية، لكن أعِد حساب نسبة الرفض ضمن نفس المعاملة
      if (target === 'returned' && order.affiliateId) {
        await recomputeRefusalRateTx(tx, order.affiliateId)
      }
    }

    return {
      kind: 'ok' as const,
      orderId: order.id,
      from,
      to: (applied ?? from) as string,
      changed: applied !== null,
      shouldPayout: applied === 'delivered',
    }
  })

  if (outcome.kind === 'not_found') return { ok: false, reason: 'not_found' }

  if (outcome.changed) {
    await sendStatusNotification(outcome.orderId, outcome.to)
  }

  return {
    ok: true,
    orderId: outcome.orderId,
    from: outcome.from,
    to: outcome.to,
    changed: outcome.changed,
    shouldPayout: outcome.shouldPayout,
  }
}

// إشعار المسوّق/التاجر بتغيّر الحالة (best-effort)
async function sendStatusNotification(orderId: string, to: string): Promise<void> {
  try {
    const [meta] = await db
      .select({
        productName: products.name,
        affiliateUserId: affiliateProfiles.user_id,
        merchantUserId: merchantProfiles.user_id,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .leftJoin(affiliateProfiles, eq(orders.affiliate_id, affiliateProfiles.id))
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!meta) return
    const name = meta.productName

    if (to === 'at_wilaya' && meta.affiliateUserId) {
      await notify({
        userId: meta.affiliateUserId,
        type: 'order_status',
        title: 'طلبيتك في الطريق 🚚',
        body: `«${name}» وصلت مركز التوزيع بالولاية`,
        link: '/affiliate/orders',
      })
    } else if (to === 'delivered') {
      if (meta.affiliateUserId) {
        await notify({
          userId: meta.affiliateUserId,
          type: 'commission_earned',
          title: 'تم تسليم طلبيتك 🎉',
          body: `«${name}» سُلّمت — أُضيفت عمولتك إلى رصيدك المعلّق`,
          link: '/affiliate/wallet',
        })
      }
      await notify({
        userId: meta.merchantUserId,
        type: 'earning_received',
        title: 'طلبية مُسلَّمة ✅',
        body: `«${name}» سُلّمت — أُضيفت أرباحك إلى رصيدك المعلّق`,
        link: '/merchant/wallet',
      })
    } else if (to === 'returned' && meta.affiliateUserId) {
      await notify({
        userId: meta.affiliateUserId,
        type: 'order_status',
        title: 'طلبية مُرتجعة ↩️',
        body: `«${name}» لم يستلمها الزبون`,
        link: '/affiliate/orders',
      })
    }
  } catch (err) {
    console.error('[ecotrack] فشل إشعار الحالة:', err)
  }
}

export interface SyncResult {
  orderId: string
  trackingNumber: string
  deliveryStatus: string | null
  status: string
  eventsApplied: number
}

/**
 * مزامنة يدوية: يسحب سجلّ التتبّع الكامل من ECOTRACK ويطبّق كل الأحداث.
 * يُستدعى من زرّ المزامنة لدى الأدمن أو عند إنشاء الطلبية.
 */
export async function syncOrderTracking(orderId: string): Promise<SyncResult> {
  const [order] = await db
    .select({
      id: orders.id,
      trackingNumber: orders.tracking_number,
      accountId: orders.ecotrack_account_id,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) throw new Error(`syncOrderTracking: طلبية غير موجودة — ${orderId}`)
  if (!order.trackingNumber) {
    throw new Error('syncOrderTracking: لا يوجد رقم تتبّع لهذه الطلبية بعد')
  }

  const client = await getEcotrackClient(order.accountId ?? undefined)
  const tracking = await client.getTracking(order.trackingNumber)
  const activities = tracking.activities ?? []

  let applied = 0
  let shouldPayout = false
  for (const act of activities) {
    if (!act.status || !act.date) continue
    const occurredAt = new Date(act.date)
    if (Number.isNaN(occurredAt.getTime())) continue
    const res = await applyEcotrackEvent({
      trackingNumber: order.trackingNumber,
      rawStatus: act.status,
      occurredAt,
      description: act.comment,
      wilaya: act.wilaya,
    })
    if (res.ok && res.changed) applied++
    if (res.ok && res.shouldPayout) shouldPayout = true
  }

  // التسوية بعد تطبيق كل الأحداث (idempotent)
  if (shouldPayout) {
    await processPayout(orderId).catch((err) => {
      console.error('[ecotrack] processPayout فشل أثناء المزامنة:', err)
    })
  }

  const [fresh] = await db
    .select({ status: orders.status, deliveryStatus: orders.delivery_status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  return {
    orderId,
    trackingNumber: order.trackingNumber,
    deliveryStatus: fresh?.deliveryStatus ?? null,
    status: fresh?.status ?? 'unknown',
    eventsApplied: applied,
  }
}
