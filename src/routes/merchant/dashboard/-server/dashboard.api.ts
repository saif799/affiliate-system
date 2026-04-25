// merchant/dashboard/-server/dashboard.api.ts

import { createServerFn } from '@tanstack/react-start'
import { mockMerchantDashboard } from './dashboard.mock'
import type { MerchantDashboardData } from '../dashboard.types'

export const getMerchantDashboard = createServerFn({
  method: 'GET',
}).handler(async (): Promise<MerchantDashboardData> => {
  // لاحقاً: استبدل بـ Drizzle ORM query حقيقية
  return mockMerchantDashboard
})