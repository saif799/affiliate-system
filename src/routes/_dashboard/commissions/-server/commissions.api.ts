import { createServerFn } from '@tanstack/react-start'
import { mockCommissionsData } from './commissions.mock'

export const getCommissionsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockCommissionsData
  },
)