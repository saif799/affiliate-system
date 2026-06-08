// ============================================================
// src/server/cron.ts  — SERVER ONLY
//
// مصادقة المهام المجدولة (cron). كل نقاط /api/cron/* تتشارك نفس الفحص:
// سرّ في الترويسة x-cron-secret يُطابَق سرّ البيئة CRON_SECRET بمقارنة
// ثابتة الزمن (timingSafeEqual) — نفس معيار توكن الملصق في delivery/label.ts،
// كي لا يُسرّب الفحص أيّ توقيت يساعد على تخمين السرّ بايتاً بايتاً.
// ============================================================

import { timingSafeEqual } from 'node:crypto'

/** مقارنة سلسلتين ثابتة الزمن (تتطلّب طولاً متساوياً؛ يُفحَص أولاً بأمان). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  // فحص الطول لا يُسرّب توقيتاً مفيداً (طول السرّ ثابت)، وهو شرط timingSafeEqual.
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * يتحقّق من سرّ المهمة المجدولة في الترويسة x-cron-secret.
 * يُعيد Response جاهزاً عند الفشل (503 إن لم يُضبط CRON_SECRET، 401 إن لم يطابق)،
 * أو null عند النجاح كي يُكمل المعالِج عمله.
 */
export function checkCronSecret(request: Request): Response | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return new Response('Cron disabled: CRON_SECRET not set', { status: 503 })
  }
  const provided = request.headers.get('x-cron-secret') ?? ''
  if (!safeEqual(provided, secret)) {
    return new Response('Unauthorized', { status: 401 })
  }
  return null
}
