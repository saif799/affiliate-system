// src/routes/dashboard/-server/dashboard.server.ts

// 1. نستورد الأداة السحرية من إطار العمل
import { createServerFn } from '@tanstack/react-start'

// 2. نستورد بياناتنا الوهمية التي جهزناها
import { mockDashboardData } from './dashboard.mock'

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
   

    return mockDashboardData
  },
)
