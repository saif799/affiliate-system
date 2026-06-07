// ============================================================
// src/server/delivery/ecotrack-sync.ts  — SERVER ONLY
//
// قلب تكامل ECOTRACK: تطبيق أحداث التتبّع على الطلبية.
// المصدر الوحيد للحالات ما بعد الشحن (at_wilaya/delivered/returned).
//
// ECOTRACK سحبيّ (pull): لا يدفع webhooks في توثيقه الرسمي، بل نستعلم عن
// get/tracking/info دوريّاً (cron) ويدويّاً (زر مزامنة الأدمن). دالة
// applyEcotrackEvent عامّة وتقبل أيضاً حالة مُرسَلة عبر webhook إن فُعِّل.
//
// - يسجّل كل حدث في order_tracking_events (idempotent).
// - يُحدّث orders.delivery_status (حالة/حدث ECOTRACK الخام) دائماً.
// - يُقدّم حالة المنصّة (status) للأمام فقط، من حالة نشطة.
// - "livred" → يُرجِع shouldPayout (التسوية تتم عبر processPayout).
// - استلام المُرتجَع → يضبط returned_at ويُعيد حساب نسبة الرفض.
// ============================================================

import { db } from '#/server/db'
import {
  orders,
  orderTrackingEvents,
  products,
  affiliateProfiles,
  merchantProfiles,
} from '#/server/db/schema'
import { and, eq, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm'
import { recomputeRefusalRateTx } from '#/server/settlement'
import { notify } from '#/server/notify'
import { ecotrackStatusLabel, getEcotrackClient } from '#/server/services/ecotrack.service'
import { processPayout } from '#/server/services/payout.service'

type PlatformTarget = 'shipped' | 'at_wilaya' | 'delivered' | 'returned' | null

// خريطة حالات/أحداث ECOTRACK الحقيقية → حالة منصّتنا الهدف (null = سجّل فقط).
// تغطّي رموز أحداث التتبّع (activity[].status) وحالات الطلبية (get/orders) معاً،
// كي تعمل سواءٌ جاء الحدث من المزامنة أو من webhook مُخصَّص.
export const ECOTRACK_TO_PLATFORM: Record<string, PlatformTarget> = {
  // ── رموز أحداث التتبّع (get/tracking/info) ──
  order_information_received_by_carrier: null, // سُجِّلت لدى الناقل
  picked: 'shipped', // استلمها الناقل
  accepted_by_carrier: 'shipped', // وصلت مركز الفرز
  dispatched_to_driver: 'at_wilaya', // مع الموزّع
  attempt_delivery: 'at_wilaya', // محاولة تسليم
  return_asked: null, // بدأ الإرجاع — لا تغيّر بعد
  return_in_transit: null, // الإرجاع في الطريق
  return_received: 'returned', // وصل المُرتجَع للبائع
  livred: 'delivered', // سُلّمت ✅
  encaissed: null, // حُصِّلت (مُسلَّمة سلفاً)
  payed: null, // دُفعت (مُسلَّمة سلفاً)
  // ── حالات الطلبية (get/orders) ──
  prete_a_expedier: 'shipped',
  en_ramassage: 'shipped',
  en_preparation_stock: 'shipped',
  en_preparation: 'shipped',
  vers_hub: 'shipped',
  en_hub: 'shipped',
  vers_wilaya: 'at_wilaya',
  en_livraison: 'at_wilaya',
  suspendu: null, // موقوفة — يقرّرها الأدمن
  livre_non_encaisse: 'delivered',
  encaisse_non_paye: 'delivered',
  paiements_prets: 'delivered',
  paye_et_archive: 'delivered',
  retour_chez_livreur: null, // طريق الإرجاع — لا تغيّر بعد
  retour_transit_entrepot: null,
  retour_en_traitement: null,
  retour_recu: 'returned',
  retour_archive: 'returned',
  annule: null, // الإلغاء قرار أدمن — لا أثر مالي تلقائي
}

export function ecotrackToPlatformStatus(raw: string): PlatformTarget {
  const key = typeof raw === 'string' ? raw.toLowerCase() : raw
  return ECOTRACK_TO_PLATFORM[key] ?? null
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

// فترة الاستطلاع الأساسية (TTL) والحدّ الأقصى للتراجع لكل طلبية (Phase 3)
const POLL_TTL_MS = 15 * 60 * 1000 // 15 دقيقة بين استطلاعَين ناجحَين
const MAX_BACKOFF_MS = 24 * 60 * 60 * 1000 // سقف التراجع الأُسّي = 24 ساعة

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

// تحويل "YYYY-MM-DD" + "HH:MM:SS" من ECOTRACK إلى Date (متّسق للـ idempotency)
function parseActivityDate(date: string, time?: string): Date {
  const iso = time ? `${date}T${time}` : `${date}T00:00:00`
  return new Date(iso)
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
  const info = await client.getTrackingInfo(order.trackingNumber)
  const activities = info.activity ?? []

  let applied = 0
  let shouldPayout = false
  for (const act of activities) {
    if (!act.status || !act.date) continue
    const occurredAt = parseActivityDate(act.date, act.time)
    if (Number.isNaN(occurredAt.getTime())) continue
    const res = await applyEcotrackEvent({
      trackingNumber: order.trackingNumber,
      rawStatus: act.status,
      occurredAt,
      description: act.reason || act.content || act.details || undefined,
      wilaya: act.station || info.currentStation || undefined,
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

/**
 * مزامنة دوريّة لكل الطلبيات النشطة (shipped/at_wilaya) التي لها رقم تتبّع.
 * يُستدعى من cron (api/cron/sync-tracking) ليُحدّث الحالات تلقائياً ويُطلق
 * التسوية عند التسليم دون انتظار زرّ الأدمن. آمن للتكرار.
 */
export async function syncAllActiveOrders(): Promise<{ orders: number; updated: number }> {
  const now = new Date()

  // اختناق (TTL): استطلِع فقط الطلبيات المستحقّة (لم يحن وقتها بعد ⇒ تُتخطّى).
  const active = await db
    .select({ id: orders.id, failures: orders.delivery_poll_failures })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ['shipped', 'at_wilaya']),
        isNotNull(orders.tracking_number),
        or(
          isNull(orders.delivery_next_poll_at),
          lte(orders.delivery_next_poll_at, now),
        ),
      ),
    )

  let updated = 0
  for (const o of active) {
    try {
      const r = await syncOrderTracking(o.id)
      if (r.eventsApplied > 0) updated++
      // نجاح: صفّر العدّاد وحدّد الاستطلاع التالي بعد TTL
      await db
        .update(orders)
        .set({
          delivery_polled_at: new Date(),
          delivery_poll_failures: 0,
          delivery_next_poll_at: new Date(Date.now() + POLL_TTL_MS),
        })
        .where(eq(orders.id, o.id))
    } catch (err) {
      console.error(`[ecotrack] فشل مزامنة الطلبية ${o.id}:`, err)
      // فشل: تراجع أُسّي لكل طلبية (cap 24h) — يمنع استنزاف API على تتبّع ميّت
      const failures = (o.failures ?? 0) + 1
      const backoff = Math.min(POLL_TTL_MS * 2 ** failures, MAX_BACKOFF_MS)
      await db
        .update(orders)
        .set({
          delivery_poll_failures: failures,
          delivery_next_poll_at: new Date(Date.now() + backoff),
        })
        .where(eq(orders.id, o.id))
    }
  }

  return { orders: active.length, updated }
}
