import { createServerFn } from '@tanstack/react-start'
import { mockOrdersData } from './orders.mock'
import type { OrdersPageData } from '../orders.types'

export const getAffiliateOrders = createServerFn({
  method: 'GET',
}).handler(async (): Promise<OrdersPageData> => {
  return mockOrdersData
})