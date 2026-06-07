import { describe, it, expect } from 'vitest'
import { ECOTRACK_STATUS_LABELS } from '#/server/services/ecotrack.service'
import { ECOTRACK_TO_PLATFORM } from '#/server/delivery/ecotrack-sync'

// حارس اكتمال خريطة الحالات (Phase 3.2): أيّ رمز حالة/حدث له تسمية عربية يجب
// أن يملك إدخالاً صريحاً في خريطة المنصّة (هدف أو null) — كي لا يسقط رمز
// جديد من الناقل بصمت دون قرار واعٍ.
describe('ECOTRACK status mapping completeness', () => {
  it('every labeled status is explicitly mapped (target or null)', () => {
    const missing = Object.keys(ECOTRACK_STATUS_LABELS).filter(
      (key) => !(key in ECOTRACK_TO_PLATFORM),
    )
    expect(missing).toEqual([])
  })

  it('every platform mapping target is a known platform status or null', () => {
    const allowed = new Set([null, 'shipped', 'at_wilaya', 'delivered', 'returned'])
    for (const [code, target] of Object.entries(ECOTRACK_TO_PLATFORM)) {
      expect(allowed.has(target), `unexpected target for ${code}: ${target}`).toBe(true)
    }
  })
})
