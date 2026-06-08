// src/routes/api/cron/sync-catalog.ts
//
// مهمّة مجدولة (cron) تُزامن كاتالوج التوصيل (الولايات/البلديات/الأسعار) من
// ECOTRACK إلى الجداول المحلّية. الأسعار تتغيّر نادراً ⇒ يكفي يوميّاً.
//
// التشغيل: منبّه خارجي مرّة يوميّاً:
//   POST /api/cron/sync-catalog   مع الترويسة:  x-cron-secret: <CRON_SECRET>
//
// لا يُكتب فوق أسعار عدّلها الأدمن (admin_override) إلا عند ?force=1.

import { createFileRoute } from '@tanstack/react-router'
import { syncDeliveryCatalog } from '#/server/delivery/catalog-sync'
import { checkCronSecret } from '#/server/cron'

export const Route = createFileRoute('/api/cron/sync-catalog')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const denied = checkCronSecret(request)
        if (denied) return denied

        const force = new URL(request.url).searchParams.get('force') === '1'
        const result = await syncDeliveryCatalog({ force })
        return Response.json({ ok: true, ...result })
      },
    },
  },
})
