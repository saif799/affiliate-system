// src/routes/api/cron/sync-tracking.ts
//
// مهمّة مجدولة (cron) تُزامن حالات التتبّع لكل الطلبيات النشطة من ECOTRACK
// (سحبيّ pull). تُحدّث at_wilaya/delivered/returned وتُطلق التسوية عند التسليم
// دون انتظار زرّ الأدمن.
//
// كيفية التشغيل: منبّه خارجي (Vercel Cron / GitHub Actions / crontab) كل ~15 دقيقة:
//   POST /api/cron/sync-tracking   مع الترويسة:  x-cron-secret: <CRON_SECRET>
//
// يتطلّب متغيّر البيئة CRON_SECRET. إن لم يُضبط → الـ endpoint معطّل (503).

import { createFileRoute } from '@tanstack/react-router'
import { syncAllActiveOrders } from '#/server/delivery/ecotrack-sync'
import { checkCronSecret } from '#/server/cron'

export const Route = createFileRoute('/api/cron/sync-tracking')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const denied = checkCronSecret(request)
        if (denied) return denied

        const result = await syncAllActiveOrders()
        return Response.json({ ok: true, ...result })
      },
    },
  },
})
