// src/routes/_dashboard/merchants/-utils/format.ts
import type { MerchantStatus } from '../-merchants.types'

export function fmt(n: number) {
  return new Intl.NumberFormat('ar-DZ').format(n)
}

export function statusLabel(s: MerchantStatus) {
  return s === 'active' ? 'نشط' : s === 'suspended' ? 'موقوف' : 'قيد الانتظار'
}

export function statusColor(s: MerchantStatus) {
  return s === 'active'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : s === 'suspended'
    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
}