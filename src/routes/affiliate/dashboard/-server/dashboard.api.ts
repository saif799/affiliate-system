import { createServerFn } from '@tanstack/react-start'
import { mockDashboardData } from './dashboard.mock'
import type { AffiliateDashboardData } from '../dashboard.types'

export const getAffiliateDashboard = createServerFn({
  method: 'GET',
}).handler(async (): Promise<AffiliateDashboardData> => {
  // لاحقاً: Drizzle ORM query
  return mockDashboardData
})