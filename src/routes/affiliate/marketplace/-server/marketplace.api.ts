import { createServerFn } from '@tanstack/react-start'
import { mockMarketplaceData } from './marketplace.mock'
import type { MarketplaceData } from '../-marketplace.types'

export const getMarketplaceData = createServerFn({
  method: 'GET',
}).handler(async (): Promise<MarketplaceData> => {
  return mockMarketplaceData
})