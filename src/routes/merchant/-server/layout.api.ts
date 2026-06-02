// src/routes/merchant/-server/layout.api.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { wallets } from '#/server/db/schema'
import { eq } from 'drizzle-orm'

export const getMerchantWalletBalance = createServerFn({
  method: 'GET',
}).handler(async (): Promise<{ availableBalance: number }> => {
  const session = await getSession()
  if (!session || session.user.role !== 'merchant') throw new Error('Unauthorized')

  const [wallet] = await db
    .select({ available: wallets.available_balance_dzd })
    .from(wallets)
    .where(eq(wallets.user_id, session.user.id))
    .limit(1)

  return { availableBalance: wallet?.available ?? 0 }
})
