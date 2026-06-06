import { describe, it, expect, vi } from 'vitest'

import { ecotrackStatusLabel } from '#/server/services/ecotrack.service'
import { ecotrackToPlatformStatus } from '#/server/delivery/ecotrack-sync'

// لا نريد عميل قاعدة بيانات حقيقياً في اختبار وحدة نقي
vi.mock('#/server/db', () => ({ db: {} }))

describe('ecotrackStatusLabel', () => {
  it('يحوّل رموز/حالات ECOTRACK الحقيقية إلى العربية', () => {
    expect(ecotrackStatusLabel('livred')).toBe('تم التسليم')
    expect(ecotrackStatusLabel('en_livraison')).toBe('قيد التسليم')
    expect(ecotrackStatusLabel('dispatched_to_driver')).toBe('مع موزّع التسليم')
    expect(ecotrackStatusLabel('retour_recu')).toBe('تم استلام المُرتجَع')
    expect(ecotrackStatusLabel('annule')).toBe('ملغاة')
  })

  it('يطبّع حالة الأحرف (Return_received)', () => {
    expect(ecotrackStatusLabel('Return_received')).toBe('تم استلام المُرتجَع')
  })

  it('يُرجِع النصّ الخام للحالة غير المعروفة', () => {
    expect(ecotrackStatusLabel('weird_status')).toBe('weird_status')
  })
})

describe('ecotrackToPlatformStatus', () => {
  it('يربط أحداث التتبّع بحالة طلبية المنصّة', () => {
    expect(ecotrackToPlatformStatus('picked')).toBe('shipped')
    expect(ecotrackToPlatformStatus('accepted_by_carrier')).toBe('shipped')
    expect(ecotrackToPlatformStatus('dispatched_to_driver')).toBe('at_wilaya')
    expect(ecotrackToPlatformStatus('attempt_delivery')).toBe('at_wilaya')
    expect(ecotrackToPlatformStatus('livred')).toBe('delivered')
    expect(ecotrackToPlatformStatus('return_received')).toBe('returned')
    expect(ecotrackToPlatformStatus('Return_received')).toBe('returned') // تطبيع
  })

  it('يربط حالات الطلبية (get/orders) بحالة المنصّة', () => {
    expect(ecotrackToPlatformStatus('en_livraison')).toBe('at_wilaya')
    expect(ecotrackToPlatformStatus('vers_wilaya')).toBe('at_wilaya')
    expect(ecotrackToPlatformStatus('en_preparation')).toBe('shipped')
    expect(ecotrackToPlatformStatus('livre_non_encaisse')).toBe('delivered')
    expect(ecotrackToPlatformStatus('paye_et_archive')).toBe('delivered')
    expect(ecotrackToPlatformStatus('retour_recu')).toBe('returned')
  })

  it('يُرجِع null للحالات التي تُسجَّل فقط دون تغيير الحالة', () => {
    expect(ecotrackToPlatformStatus('order_information_received_by_carrier')).toBeNull()
    expect(ecotrackToPlatformStatus('return_asked')).toBeNull()
    expect(ecotrackToPlatformStatus('encaissed')).toBeNull()
    expect(ecotrackToPlatformStatus('suspendu')).toBeNull()
    expect(ecotrackToPlatformStatus('annule')).toBeNull()
    expect(ecotrackToPlatformStatus('unknown')).toBeNull()
  })
})
