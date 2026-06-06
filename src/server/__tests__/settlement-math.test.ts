import { describe, it, expect } from 'vitest'
import { computeSettlement } from '#/server/settlement-math'

describe('computeSettlement — محرّك العمولة', () => {
  // TC-01 — يثبّت نموذج الرسوم per-order (كان per-unit خطأً سابقاً)
  it('يطرح رسوم المنصة مرّة واحدة للطلبية لا لكل وحدة', () => {
    const r = computeSettlement({
      hasAffiliate: true,
      affiliatePrice: 3000,
      merchantPrice: 2000,
      feeAffiliate: 100,
      feeMerchant: 100,
      quantity: 3,
    })
    // per-order الصحيح:  (3000−2000)×3 − 100 = 2900
    // per-unit الخاطئ:   (3000−2000−100)×3   = 2700  ← يجب ألا يساوي هذا
    expect(r.commission).toBe(2900)
    expect(r.commission).not.toBe(2700)
    // أرباح التاجر = 2000×3 − 100 = 5900
    expect(r.merchantEarning).toBe(5900)
    // رسوم المنصة = 100 + 100
    expect(r.platformFee).toBe(200)
  })

  // TC-02 — لا عمولة عند غياب المسوّق
  it('عمولة المسوّق = 0 عندما لا يوجد مسوّق', () => {
    const r = computeSettlement({
      hasAffiliate: false,
      affiliatePrice: 3000,
      merchantPrice: 2000,
      feeAffiliate: 100,
      feeMerchant: 100,
      quantity: 1,
    })
    expect(r.commission).toBe(0)
    expect(r.merchantEarning).toBe(1900) // 2000 − 100
    expect(r.platformFee).toBe(200)
  })

  // TC-03 — الحماية من القيم السالبة (الرسم > الهامش)
  it('يحجز العمولة وأرباح التاجر عند الصفر إن تجاوز الرسمُ الهامش', () => {
    const r = computeSettlement({
      hasAffiliate: true,
      affiliatePrice: 2050,
      merchantPrice: 2000,
      feeAffiliate: 500, // أكبر من الهامش 50
      feeMerchant: 5000, // أكبر من 2000
      quantity: 1,
    })
    expect(r.commission).toBe(0)
    expect(r.merchantEarning).toBe(0)
    expect(r.platformFee).toBe(5500)
  })

  // TC-04 — الحالة العادية بكمية 1
  it('يحسب بشكل صحيح للحالة الشائعة (كمية = 1)', () => {
    const r = computeSettlement({
      hasAffiliate: true,
      affiliatePrice: 4500,
      merchantPrice: 3000,
      feeAffiliate: 50,
      feeMerchant: 50,
      quantity: 1,
    })
    expect(r.commission).toBe(1450) // 1500 − 50
    expect(r.merchantEarning).toBe(2950) // 3000 − 50
    expect(r.platformFee).toBe(100)
  })
})
