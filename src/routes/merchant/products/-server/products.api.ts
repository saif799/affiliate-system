// merchant/products/-server/products.api.ts

import { createServerFn } from '@tanstack/react-start'
import { mockMerchantProducts } from './products.mock'
import type { MerchantProductsData } from '../products.types'

export const getMerchantProducts = createServerFn({
  method: 'GET',
}).handler(async (): Promise<MerchantProductsData> => {
  return mockMerchantProducts
})