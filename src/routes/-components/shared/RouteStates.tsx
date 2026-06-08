// ============================================================
// src/routes/-components/shared/RouteStates.tsx
//
// حالات المسار المشتركة لمعالِجات الـ loader:
//   PageSpinner → pendingComponent (هيكل تحميل مركزي موحّد)
//   PageError   → errorComponent  (حدّ خطأ موحّد: رسالة عربية + إعادة محاولة)
//
// يُغني عن تكرار نفس الـ JSX في كل مسار، ويضمن أن فشل الـ loader يعرض رسالة
// لطيفة بدل شاشة الخطأ الخام للموجّه.
// ============================================================

import { useRouter } from '@tanstack/react-router'

/** هيكل تحميل مركزي يُستخدم كـ pendingComponent للمسارات. */
export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center" dir="rtl">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
    </div>
  )
}

/** حدّ خطأ موحّد يُستخدم كـ errorComponent: رسالة + زر إعادة المحاولة. */
export function PageError({ error }: { error: unknown }) {
  const router = useRouter()
  const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
  return (
    <div
      className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center"
      dir="rtl"
    >
      <p className="text-sm font-medium text-gray-700">تعذّر تحميل البيانات</p>
      <p className="max-w-md text-xs text-gray-400">{msg}</p>
      <button
        onClick={() => router.invalidate()}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
      >
        إعادة المحاولة
      </button>
    </div>
  )
}
