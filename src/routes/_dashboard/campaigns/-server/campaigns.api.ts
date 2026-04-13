import { createServerFn } from '@tanstack/react-start'
import { mockCampaignsData } from './campaigns.mock'

export const getCampaignsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return mockCampaignsData
  },
)