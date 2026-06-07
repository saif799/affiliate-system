// ============================================================
// src/server/delivery/label.ts  — SERVER ONLY
//
// نظام توكن الملصق الداخلي (Phase 5) — موقّع HMAC-SHA256، مع صلاحية 72 ساعة.
//
// التوكن (مُرمَّز في رمز QR على الملصق الداخلي للتاجر):
//   v1.<internal_shipment_id>.<issued_at_ms>.<sig>
//   sig = base64url( HMAC_SHA256("<internal_shipment_id>.<issued_at_ms>", SECRET) )
//
// خصائص أمنية: المفتاح لا يغادر الخادم؛ رمز QR لا يحوي معرّف الطلب الخام ولا
// أيّ PII؛ التوقيع غير قابل للتزوير دون المفتاح؛ المقارنة ثابتة الزمن
// (timingSafeEqual)؛ الصلاحية تحدّ من إعادة التشغيل (replay)؛ والاستخدام
// مرّة واحدة يُفرَض ذرّيّاً عبر عمود orders.label_token_used_at عند الطباعة.
//
// السرّ: متغيّر البيئة LABEL_HMAC_SECRET (≥32 بايت) — fail-closed إن غاب.
// ============================================================

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

const TOKEN_VERSION = 'v1'
export const LABEL_TOKEN_TTL_MS = 72 * 60 * 60 * 1000 // 72 ساعة

function secret(): string {
  const s = process.env.LABEL_HMAC_SECRET
  if (!s || s.length < 32) {
    throw new Error(
      'LABEL_HMAC_SECRET غير مضبوط أو قصير — مطلوب 32 حرفاً على الأقل لتأمين الملصقات',
    )
  }
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest())
}

/** مرجع شحنة داخلي بشريّ مقروء وفريد عمليّاً (SHP-XXXXXXXX). */
export function generateInternalShipmentId(): string {
  return `SHP-${randomBytes(4).toString('hex').toUpperCase()}`
}

/** يُصدر توكن ملصق موقّعاً يربط المرجع الداخلي بلحظة الإصدار. */
export function issueLabelToken(internalShipmentId: string, issuedAtMs: number): string {
  const payload = `${internalShipmentId}.${issuedAtMs}`
  return `${TOKEN_VERSION}.${payload}.${sign(payload)}`
}

export type LabelTokenVerify =
  | { ok: true; internalShipmentId: string; issuedAt: number }
  | { ok: false; reason: 'malformed' | 'invalid_signature' | 'expired' }

/** يتحقّق من توكن الملصق: الشكل ثم التوقيع (ثابت الزمن) ثم الصلاحية. */
export function verifyLabelToken(token: string, nowMs: number): LabelTokenVerify {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return { ok: false, reason: 'malformed' }

  const [, id, msStr, sig] = parts
  const issuedAt = Number(msStr)
  if (!id || !Number.isFinite(issuedAt)) return { ok: false, reason: 'malformed' }

  const expected = sign(`${id}.${msStr}`)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  // المقارنة ثابتة الزمن تتطلّب طولاً متساوياً — افحص الطول أولاً (لا يُسرّب توقيتاً).
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid_signature' }
  }

  if (nowMs - issuedAt > LABEL_TOKEN_TTL_MS) return { ok: false, reason: 'expired' }
  return { ok: true, internalShipmentId: id, issuedAt }
}
