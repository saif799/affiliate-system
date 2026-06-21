// src/lib/session.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/server/auth'

// يُسلسل الخطأ مع سلسلة cause + رمز pg (مثل 28P01, ENOTFOUND) لتشخيص دقيق.
function describeError(e: unknown, depth = 0): string {
  if (depth > 5 || e == null) return ''
  if (e instanceof Error) {
    const code = (e as { code?: string }).code
    const cause = (e as { cause?: unknown }).cause
    return (
      `${e.name}${code ? `(${code})` : ''}: ${e.message}` +
      (cause ? ` ⤷ ${describeError(cause, depth + 1)}` : '')
    )
  }
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    return session ?? null
  } catch (err) {
    // عطل بنية تحتية (قاعدة بيانات غير متاحة مثلاً) ليس "غياب جلسة".
    // نُعيده ليُعرض كخطأ خادم — لا نُرجِع null كي لا يُطرَد كل المستخدمين
    // إلى صفحة الدخول عند انقطاع مؤقت. نُسجّل السبب الكامل في سجلّات Vercel فقط.
    const detail = describeError(err)
    console.error('[getSession] فشل قراءة الجلسة:', detail)
    // أمان: لا نُسرّب تفاصيل القاعدة/البنية التحتية (رموز pg، أسماء مضيفين…) إلى
    // واجهة المستخدم. السبب الحقيقي يبقى في سجلّات الخادم؛ المستخدم يرى رسالة عامّة.
    throw new Error('تعذّر التحقّق من الجلسة مؤقتاً. حاوِل مجدّداً بعد لحظات.')
  }
})
