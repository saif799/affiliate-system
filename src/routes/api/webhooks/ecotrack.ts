// src/routes/api/webhooks/ecotrack.ts
//
// مُستقبِل تحديثات حالة الشحنة من ECOTRACK.
//   POST /api/webhooks/ecotrack
//   Headers:  x-ecotrack-secret: <ECOTRACK_WEBHOOK_SECRET>
//   Body (JSON): {
//     "tracking": "DZ-123456",      // مطلوب — لمطابقة الطلبية
//     "status": "livre",            // مطلوب — حالة ECOTRACK الخام
//     "occurred_at": "2026-06-06T10:00:00Z", // اختياري
//     "comment": "...",             // اختياري
//     "wilaya": "..."               // اختياري
//   }
//
// يتطلّب ECOTRACK_WEBHOOK_SECRET. إن لم يُضبط → معطّل (503).

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { applyEcotrackEvent } from '#/server/delivery/ecotrack-sync'
import { processPayout } from '#/server/services/payout.service'

const PayloadSchema = z.object({
  tracking: z.string().trim().min(1).max(100),
  status: z.string().trim().min(1).max(60),
  occurred_at: z.string().datetime().optional(),
  comment: z.string().trim().max(300).optional(),
  wilaya: z.string().trim().max(60).optional(),
})

export const Route = createFileRoute('/api/webhooks/ecotrack')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const secret = process.env.ECOTRACK_WEBHOOK_SECRET
        if (!secret) {
          return new Response('Webhook disabled: ECOTRACK_WEBHOOK_SECRET not set', {
            status: 503,
          })
        }
        if (request.headers.get('x-ecotrack-secret') !== secret) {
          return new Response('Unauthorized', { status: 401 })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        const parsed = PayloadSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
        }

        const { tracking, status, occurred_at, comment, wilaya } = parsed.data
        const result = await applyEcotrackEvent({
          trackingNumber: tracking,
          rawStatus: status,
          occurredAt: occurred_at ? new Date(occurred_at) : new Date(),
          description: comment,
          wilaya,
        })

        if (!result.ok) {
          return Response.json(result, { status: 404 })
        }

        // التسوية المالية بعد ثبوت "livre" — معاملة منفصلة، idempotent عبر settled_at
        if (result.shouldPayout) {
          try {
            await processPayout(result.orderId)
          } catch (err) {
            console.error('[ecotrack webhook] processPayout فشل:', err)
            // 500 → يُعيد ECOTRACK الإرسال لاحقاً (آمن للتكرار)
            return Response.json({ ok: false, error: 'payout_failed' }, { status: 500 })
          }
        }

        return Response.json(result, { status: 200 })
      },
    },
  },
})
