// src/routes/api/cron/release-funds.ts
//
// نقطة دخول للمهمة المجدولة (cron) التي تُحرّر الأرباح المنتهية مدّة حجزها
// (pending → available) لكل المستخدمين، دون انتظار أن يفتحوا محافظهم.
//
// كيفية التشغيل: اضبط منبّهاً خارجياً (Vercel Cron / GitHub Actions / crontab)
// يُرسل كل ساعة:
//   POST /api/cron/release-funds   مع الترويسة:  x-cron-secret: <CRON_SECRET>
//
// يتطلّب متغيّر البيئة CRON_SECRET. إن لم يُضبط → الـ endpoint معطّل (503).

import { createFileRoute } from '@tanstack/react-router'
import { releaseAllMaturedFunds } from '#/server/settlement'

export const Route = createFileRoute('/api/cron/release-funds')({
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

        const result = await releaseAllMaturedFunds()
        return Response.json({ ok: true, ...result })
      },
    },
  },
})
