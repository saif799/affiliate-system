import { describe, it, expect, vi } from 'vitest'

import { ecotrackStatusLabel } from '#/server/services/ecotrack.service'
import { ecotrackToPlatformStatus } from '#/server/delivery/ecotrack-sync'

// لا نريد عميل قاعدة بيانات حقيقياً في اختبار وحدة نقي
vi.mock('#/server/db', () => ({ db: {} }))

describe('ecotrackStatusLabel', () => {
  it('يحوّل الحالات المعروفة إلى العربية', () => {
    expect(ecotrackStatusLabel('en_attente')).toBe('في الانتظار')
    expect(ecotrackStatusLabel('pris_en_charge')).toBe('تم الاستلام')
    expect(ecotrackStatusLabel('en_cours_livraison')).toBe('جاري التسليم')
    expect(ecotrackStatusLabel('livre')).toBe('تم التسليم')
    expect(ecotrackStatusLabel('retourne')).toBe('مسترجعة')
    expect(ecotrackStatusLabel('retourne_paye')).toBe('مسترجعة مدفوعة')
  })

  it('يُرجِع النصّ الخام للحالة غير المعروفة', () => {
    expect(ecotrackStatusLabel('weird_status')).toBe('weird_status')
  })
})

describe('ecotrackToPlatformStatus', () => {
  it('يربط حالات التوصيل بحالة طلبية المنصّة', () => {
    expect(ecotrackToPlatformStatus('pris_en_charge')).toBe('shipped')
    expect(ecotrackToPlatformStatus('en_transit')).toBe('shipped')
    expect(ecotrackToPlatformStatus('en_cours_livraison')).toBe('at_wilaya')
    expect(ecotrackToPlatformStatus('livre')).toBe('delivered')
    expect(ecotrackToPlatformStatus('retourne')).toBe('returned')
  })

  it('يُرجِع null للحالات التي تُسجَّل فقط دون تغيير الحالة', () => {
    expect(ecotrackToPlatformStatus('en_attente')).toBeNull()
    expect(ecotrackToPlatformStatus('retourne_paye')).toBeNull()
    expect(ecotrackToPlatformStatus('echec_livraison')).toBeNull()
    expect(ecotrackToPlatformStatus('annule')).toBeNull()
    expect(ecotrackToPlatformStatus('unknown')).toBeNull()
  })
})
