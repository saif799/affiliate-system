// ============================================================
// src/server/services/payout.service.ts  — SERVER ONLY
//
// الدفع عند بلوغ الطلبية حالة "livre" (تم التسليم).
//
// قرار معماري: نُعيد استخدام محرّك التسوية الموجود (settlement.ts) بدل
// بناء نموذج مدفوعات موازٍ. settleOrderTx يُنشئ معاملات العمولة/الأرباح/
// رسوم المنصّة ويُحدّث المحافظ ضمن نموذج الحجز (pending → available)، وهو
// آمن للتكرار عبر settled_at. هكذا يبقى نظام تسوية واحد فقط (لا ازدواج رصيد).
// ============================================================

import { db } from '#/server/db'
import { orders } from '#/server/db/schema'
import { eq } from 'drizzle-orm'
import { settleOrderTx, recomputeRefusalRateTx } from '#/server/settlement'

export interface PayoutResult {
  orderId: string
  settled: boolean // هل جرت تسوية فعلية الآن
  alreadySettled: boolean // كانت مُسوّاة مسبقاً (idempotent)
}

/**
 * يُسوّي طلبية مُسلَّمة مالياً: عمولة المسوّق + أرباح التاجر + رسوم المنصّة،
 * ضمن معاملة DB واحدة. آمن للتكرار وللتزامن (قفل الصف + settled_at).
 *
 * يُستدعى من webhook التوصيل عند "livre"، ومن زرّ المزامنة اليدوي للأدمن.
 */
export async function processPayout(orderId: string): Promise<PayoutResult> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        status: orders.status,
        affiliateId: orders.affiliate_id,
        settledAt: orders.settled_at,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for('update')
      .limit(1)

    if (!order) throw new Error(`processPayout: طلبية غير موجودة — ${orderId}`)

    if (order.status !== 'delivered') {
      throw new Error(
        `processPayout: لا تسوية إلا لطلبية مُسلَّمة (الحالة الحالية: ${order.status})`,
      )
    }

    if (order.settledAt) {
      return { orderId, settled: false, alreadySettled: true }
    }

    // التسوية المالية الفعلية (تُنشئ المعاملات وتُحدّث المحافظ)
    await settleOrderTx(tx, orderId)

    // التسليم يغيّر مقام نسبة الرفض → أعِد حسابها
    if (order.affiliateId) {
      await recomputeRefusalRateTx(tx, order.affiliateId)
    }

    return { orderId, settled: true, alreadySettled: false }
  })
}
