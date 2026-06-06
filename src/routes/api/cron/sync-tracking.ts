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

export const Route = createFileRoute('/api/cron/sync-tracking')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const secret = process.env.CRON_SECRET
        if (!secret) {
          return new Response('Cron disabled: CRON_SECRET not set', { status: 503 })
        }
        if (request.headers.get('x-cron-secret') !== secret) {
          return new Response('Unauthorized', { status: 401 })
        }

        const result = await syncAllActiveOrders()
        return Response.json({ ok: true, ...result })
      },
    },
  },
})
