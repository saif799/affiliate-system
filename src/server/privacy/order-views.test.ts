import { describe, it, expect } from 'vitest'
import { toMerchantOrderView  } from './order-views'
import type {MerchantOrderRaw} from './order-views';

const fullRow: MerchantOrderRaw = {
  id: 'order-1',
  createdAt: new Date('2026-06-07T10:00:00Z'),
  productName: 'سماعات',
  productVariant: 'أسود',
  wilaya: 'الجزائر',
  deliveryType: 'office',
  officeName: 'بئر مراد رايس',
  quantity: 2,
  totalPrice: 6000,
  merchantEarnings: 3950,
  status: 'shipped',
  dbStatus: 'shipped',
  trackingNumber: 'DHDXYZ',
  internalShipmentId: 'SHP-AB12CD',
  // PII — must never appear in the merchant view:
  customerName: 'عمر بن علي',
  customerPhone: '0551234567',
  customerAddress: 'حي النصر، شارع 5',
  customerCommune: 'بئر مراد رايس',
  customerNote: 'اتصل قبل التسليم',
}

describe('toMerchantOrderView', () => {
  it('never leaks customer PII to the merchant', () => {
    const view = toMerchantOrderView(fullRow) as unknown as Record<string, unknown>
    const serialized = JSON.stringify(view)

    // No PII values present anywhere in the output:
    for (const pii of ['عمر بن علي', '0551234567', 'حي النصر، شارع 5', 'اتصل قبل التسليم']) {
      expect(serialized).not.toContain(pii)
    }
    // No PII keys present:
    expect(view.customer).toBeUndefined()
    expect(view.customerName).toBeUndefined()
    expect(view.customerPhone).toBeUndefined()
    expect(view.address).toBeUndefined()
    expect(view.customerAddress).toBeUndefined()
    expect(view.note).toBeUndefined()
  })

  it('keeps the merchant-allowed fields', () => {
    const view = toMerchantOrderView(fullRow)
    expect(view.id).toBe('order-1')
    expect(view.wilaya).toBe('الجزائر')
    expect(view.deliveryType).toBe('office')
    expect(view.officeName).toBe('بئر مراد رايس') // office name is NOT PII
    expect(view.quantity).toBe(2)
    expect(view.trackingNumber).toBe('DHDXYZ')
    expect(view.createdAt).toBe('2026-06-07')
  })

  it('hides office name for home delivery', () => {
    const view = toMerchantOrderView({ ...fullRow, deliveryType: 'home' })
    expect(view.officeName).toBeUndefined()
  })
})
