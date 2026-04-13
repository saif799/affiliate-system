import { createServerFn } from '@tanstack/react-start'
import { mockAnalyticsData } from './analytics.mock'

export const getAnalyticsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockAnalyticsData
  },
)