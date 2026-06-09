// ============================================================
// src/server/settlement-math.ts
//
// حساب مبالغ التسوية — منطق نقي (بلا DB) قابل للاختبار بمعزل.
//
//   commission       = max(0, (سعر المسوّق − سعر التاجر) × الكمية − رسم المسوّق − سعر التوصيل)
//   merchant_earning = max(0, سعر التاجر × الكمية − رسم التاجر)
//
// التوصيل يُخصم من المسوّق فقط: الزبون يدفع سعر البيع (COD)، الناقل يقتطع رسم
// التوصيل، فيتحمّله هامشُ المسوّق (لذا الحدّ الأدنى للبيع = الجملة + التوصيل).
//   platform_fee     = رسم التاجر + رسم المسوّق   (per-order)
// ============================================================

export type SettlementInput = {
  hasAffiliate: boolean
  affiliatePrice: number
  merchantPrice: number
  feeAffiliate: number
  feeMerchant: number
  shippingFee: number // سعر التوصيل (per-order) — يُخصم من عمولة المسوّق
  quantity: number
}

export type SettlementAmounts = {
  commission: number
  merchantEarning: number
  platformFee: number
}

export function computeSettlement(i: SettlementInput): SettlementAmounts {
  const commission = i.hasAffiliate
    ? Math.max(
        0,
        (i.affiliatePrice - i.merchantPrice) * i.quantity -
          i.feeAffiliate -
          i.shippingFee,
      )
    : 0
  const merchantEarning = Math.max(
    0,
    i.merchantPrice * i.quantity - i.feeMerchant,
  )
  const platformFee = i.feeMerchant + i.feeAffiliate
  return { commission, merchantEarning, platformFee }
}
