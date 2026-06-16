// ============================================================
// src/server/notifications.ts
//
// دوال خادم واجهة جرس الإشعارات (يستوردها مكوّن العميل NotificationBell).
// تستخدم db داخل handlers فقط → يُجرّدها المُجمِّع من حزمة العميل بأمان.
//
// ملاحظة: مساعدات الإنشاء (notify/notifyMany/notifySuperAdmins) في
// '#/server/notify' (خادم فقط) كي لا يتسرّب Buffer إلى المتصفّح.
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { notifications } from '#/server/db/schema'
import { eq, desc, and, isNull, sql } from 'drizzle-orm'

// جرس الإشعارات: يعرض غير المقروءة فقط (القائمة الكاملة في صفحة الإشعارات).
export const getMyNotifications = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const items = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, session.user.id),
          isNull(notifications.read_at),
        ),
      )
      .orderBy(desc(notifications.created_at))
      .limit(30)

    const [unreadRow] = await db
      .select({ unread: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, session.user.id),
          isNull(notifications.read_at),
        ),
      )

    return {
      unreadCount: Number(unreadRow?.unread ?? 0),
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.read_at?.toISOString() ?? null,
        createdAt: n.created_at.toISOString(),
      })),
    }
  },
)

// القائمة الكاملة لصفحة الإشعارات المخصّصة (أكبر من قائمة الجرس المختصرة)
export const getMyNotificationsPage = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, session.user.id))
      .orderBy(desc(notifications.created_at))
      .limit(100)

    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      readAt: n.read_at?.toISOString() ?? null,
      createdAt: n.created_at.toISOString(),
    }))
  },
)

export const markNotificationRead = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    await db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(
        and(
          eq(notifications.id, data.id),
          eq(notifications.user_id, session.user.id),
        ),
      )
    return { success: true }
  })

export const markAllNotificationsRead = createServerFn({
  method: 'POST',
}).handler(async (): Promise<{ success: boolean }> => {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(notifications)
    .set({ read_at: new Date() })
    .where(
      and(
        eq(notifications.user_id, session.user.id),
        isNull(notifications.read_at),
      ),
    )
  return { success: true }
})
