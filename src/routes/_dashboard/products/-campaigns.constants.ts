// src/routes/_dashboard/campaigns/-campaigns.constants.ts
//
// ثوابت business logic للحملات.
// أي تغيير في سياسة العمل يحدث هنا فقط — لا بحث في الملفات.

// ── حالات الطلبات ────────────────────────────────────────────
// مشتقة من orderStatusEnum في الـ schema
export const ORDER_STATUS = {
  DELIVERED: 'delivered',
  RETURNED:  'returned',
} as const

// ── حد الإرجاع المرتفع ───────────────────────────────────────
// منتج تتجاوز نسبة إرجاعه هذه القيمة يُصنَّف كـ "إرجاع مرتفع"
export const HIGH_RETURN_THRESHOLD = 30