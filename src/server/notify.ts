// ============================================================
// src/server/notify.ts  — SERVER ONLY
//
// مساعدات إنشاء الإشعارات (تستخدم db مباشرةً، خارج أي createServerFn).
// يجب ألّا يستوردها أي مكوّن عميل — تُستدعى فقط من دوال الخادم.
// (فُصلت عن notifications.ts كي لا يتسرّب عميل قاعدة البيانات/Buffer
//  إلى حزمة المتصفّح عبر جرس الإشعارات.)
// ============================================================

import { db } from '#/server/db'
import type { notificationTypeEnum} from '#/server/db/schema';
import { notifications, users } from '#/server/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number]

export type NotifyInput = {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}

// best-effort — تبتلع الأخطاء فلا تكسر التدفّق الرئيسي أبداً
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await db.insert(notifications).values({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    })
  } catch (err) {
    console.error('[notify] فشل إنشاء إشعار:', err)
  }
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return
  try {
    await db.insert(notifications).values(
      inputs.map((i) => ({
        user_id: i.userId,
        type: i.type,
        title: i.title,
        body: i.body ?? null,
        link: i.link ?? null,
      })),
    )
  } catch (err) {
    console.error('[notifyMany] فشل إنشاء إشعارات:', err)
  }
}

/** إشعار كل مديري المنصة (super_admin) */
export async function notifySuperAdmins(
  input: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'super_admin'), isNull(users.deleted_at)))
    await notifyMany(admins.map((a) => ({ ...input, userId: a.id })))
  } catch (err) {
    console.error('[notifySuperAdmins] فشل:', err)
  }
}
