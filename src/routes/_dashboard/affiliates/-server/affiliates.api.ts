import { createServerFn } from '@tanstack/react-start'
import { affiliatesMock } from './affiliates.mock'
import type { AffiliatesData } from '../affiliates.types'

export const getAffiliatesData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AffiliatesData> => {
   

    return affiliatesMock
  },
)
