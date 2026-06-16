// src/lib/session.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/server/auth'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    return session ?? null
  } catch (err) {
    // عطل بنية تحتية (قاعدة بيانات غير متاحة مثلاً) ليس "غياب جلسة".
    // نُعيده ليُعرض كخطأ خادم — لا نُرجِع null كي لا يُطرَد كل المستخدمين
    // إلى صفحة الدخول عند انقطاع مؤقت. نُسجّل سطراً مختصراً فقط.
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[getSession] فشل قراءة الجلسة:', msg.split('\n')[0].slice(0, 200))
    throw err
  }
})