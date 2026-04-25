// merchant/orders/-server/orders.api.ts

import { createServerFn } from '@tanstack/react-start'
import { mockMerchantOrders } from './orders.mock'
import type { MerchantOrdersData } from '../orders.types'

export const getMerchantOrders = createServerFn({
  method: 'GET',
}).handler(async (): Promise<MerchantOrdersData> => {
  // لاحقاً: استبدل بـ Drizzle ORM query
  return mockMerchantOrders
})