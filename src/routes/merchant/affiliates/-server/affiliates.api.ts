// src/routes/merchant/affiliates/-server/affiliates.api.ts

import { createServerFn } from '@tanstack/react-start'
import { mockAffiliatesData } from './affiliates.mock'
import type { AffiliatesPageData } from '../affiliates.types'

export const getAffiliatesData = createServerFn({
  method: 'GET',
}).handler(async (): Promise<AffiliatesPageData> => {
  // لاحقاً: استبدل بـ Drizzle ORM query
  return mockAffiliatesData
})