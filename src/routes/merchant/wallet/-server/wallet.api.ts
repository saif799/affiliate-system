import { createServerFn } from '@tanstack/react-start'
import { walletMockData } from './wallet.mock'
import type { WalletData } from '../wallet.types'

export const getWalletData = createServerFn({
  method: 'GET',
}).handler(async (): Promise<WalletData> => {
  // لاحقاً: Drizzle ORM queries
  return walletMockData
})