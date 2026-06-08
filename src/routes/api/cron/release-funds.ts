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
import { checkCronSecret } from '#/server/cron'

export const Route = createFileRoute('/api/cron/release-funds')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const denied = checkCronSecret(request)
        if (denied) return denied

        const result = await releaseAllMaturedFunds()
        return Response.json({ ok: true, ...result })
      },
    },
  },
})
