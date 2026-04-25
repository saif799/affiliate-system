// ============================================================
// -server/wallet.api.ts
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { mockWalletData } from './wallet.mock'
import type { WalletData, WithdrawFormData, WithdrawalRequest } from '../wallet.types'

// جلب بيانات المحفظة الكاملة
export const getWalletData = createServerFn({
  method: 'GET',
}).handler(async (): Promise<WalletData> => {
  // لاحقاً: Drizzle ORM query
  // const affiliate = await db.query.affiliates.findFirst({ where: eq(affiliates.id, ctx.affiliateId) })
  // const transactions = await db.query.transactions.findMany({ where: eq(transactions.affiliateId, ctx.affiliateId), orderBy: desc(transactions.createdAt) })
  // const withdrawals = await db.query.withdrawals.findMany({ where: eq(withdrawals.affiliateId, ctx.affiliateId) })
  return mockWalletData
})

// إنشاء طلب سحب جديد
export const createWithdrawalRequest = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): WithdrawFormData => {
    // لاحقاً: Zod validation
    return data as WithdrawFormData
  })
  .handler(async ({ data }): Promise<WithdrawalRequest> => {
    // لاحقاً: Drizzle ORM insert
    // const withdrawal = await db.insert(withdrawals).values({ ... }).returning()
    const newWithdrawal: WithdrawalRequest = {
      id: `WD-${String(Date.now()).slice(-4)}`,
      amount: data.amount,
      method: data.method,
      accountNumber: data.accountNumber,
      status: 'pending',
      date: new Date().toISOString(),
    }
    return newWithdrawal
  })