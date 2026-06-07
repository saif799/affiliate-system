// src/routes/api/webhooks/ecotrack.ts
//
// ⚠️ مُعطّل عمداً (Phase 3). ECOTRACK سحبيّ (pull) فقط — مزامنة الحالات تتمّ
// حصراً عبر الاستطلاع المجدول (api/cron/sync-tracking) + المزامنة اليدوية للأدمن.
// لا يوجد أيّ تدفّق webhook في المنصّة. أُبقي هذا الملفّ كشاهدة (tombstone)
// يعيد 410 Gone؛ يمكن حذفه نهائياً عند أوّل `vite build` (يُعاد توليد routeTree
// تلقائياً فيختفي المسار). لا يستورد منطق تطبيق الأحداث بعد الآن.

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/webhooks/ecotrack')({
  server: {
    handlers: {
      POST: () =>
        new Response(
          'Gone: ECOTRACK webhooks are disabled. Status sync is polling-only.',
          { status: 410 },
        ),
    },
  },
})
