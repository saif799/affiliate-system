// src/lib/app-url.ts
// ============================================================
// مصدر واحد موثوق لأصل (origin) التطبيق العام.
// آمن على العميل، أثناء SSR، وعلى Vercel — يتفادى ترميز localhost أو نطاق
// ثابت داخل منطق متناثر قد يتسرّب إلى الإنتاج ويكسر الروابط/المصادقة.
//
// يُستعمل في:
//   - عميل better-auth (baseURL)
//   - بناء روابط الإحالة / صفحات البيع للمسوّق
//   - أي رابط مطلق يُولَّد من الخادم أو العميل
// ============================================================

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * يُعيد أصل التطبيق (مثل https://app.example.com) بلا شرطة نهائية.
 *
 * ترتيب الحسم:
 *  1) VITE_APP_URL المضمّن وقت البناء — يطابق بين SSR والعميل ⇒ لا عدم تطابق ترطيب.
 *  2) origin الحالي في المتصفّح — صحيح دائماً على العميل.
 *  3) متغيّرات الخادم (BETTER_AUTH_URL ثم مضيف Vercel التلقائي) أثناء SSR.
 *  4) localhost — للتطوير المحلّي فقط، لا يصل إليه الإنتاج عملياً.
 */
export function getAppBaseUrl(): string {
  const viteUrl = import.meta.env.VITE_APP_URL as string | undefined
  if (viteUrl) return stripTrailingSlash(viteUrl)

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  // أثناء SSR/دوال الخادم: لا توجد نافذة — نعتمد على بيئة الخادم.
  const env = typeof process !== 'undefined' ? process.env : undefined
  if (env?.BETTER_AUTH_URL) return stripTrailingSlash(env.BETTER_AUTH_URL)
  // متغيّرات يوفّرها Vercel تلقائياً (بلا بروتوكول).
  if (env?.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (env?.VERCEL_URL) return `https://${env.VERCEL_URL}`

  return 'http://localhost:3000'
}

/** يبني رابطاً مطلقاً من مسار نسبي اعتماداً على أصل التطبيق. */
export function absoluteUrl(path = ''): string {
  const base = getAppBaseUrl()
  if (!path) return base
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
