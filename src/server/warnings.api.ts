// ============================================================
// src/server/warnings.api.ts
//
// خيط محادثة تنبيهات الإدارة (إنذار) — ثنائي الاتجاه:
//   - التنبيه الأصلي مُخزَّن في verifications (identifier=warning:<userId>).
//   - الردود في warning_replies (من التاجر/المسوّق أو من الأدمن).
// المسوّق/التاجر يردّ فيصل الرد للأدمن (إشعار)، والأدمن يردّ فيصل للمستخدم.
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { verifications, warningReplies, users } from '#/server/db/schema'
import { eq, asc, desc, inArray, sql } from 'drizzle-orm'
import { notify, notifySuperAdmins } from '#/server/notify'

const WARN_PREFIX = 'warning:'

function roleNotificationsPath(role: string): string {
  return role === 'merchant' ? '/merchant/notifications' : '/affiliate/notifications'
}

function roleAdminPath(role: string): string {
  return role === 'merchant' ? '/merchants' : '/affiliates'
}

function roleLabel(role: string): string {
  return role === 'merchant' ? 'التاجر' : role === 'affiliate' ? 'المسوّق' : 'المستخدم'
}

// ── قائمة تنبيهات المستخدم الحالي + عدد الردود لكل تنبيه ──
export interface MyWarning {
  id: string
  message: string
  sentAt: string
  replyCount: number
  lastActivityAt: string
}

export const getMyWarnings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MyWarning[]> => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const rows = await db
      .select({
        id: verifications.id,
        value: verifications.value,
        createdAt: verifications.createdAt,
      })
      .from(verifications)
      .where(eq(verifications.identifier, `${WARN_PREFIX}${session.user.id}`))
      .orderBy(desc(verifications.createdAt))

    const ids = rows.map((r) => r.id)
    const counts = ids.length
      ? await db
          .select({
            wid: warningReplies.warning_id,
            c: sql<number>`COUNT(*)`,
            last: sql<string>`MAX(${warningReplies.created_at})`,
          })
          .from(warningReplies)
          .where(inArray(warningReplies.warning_id, ids))
          .groupBy(warningReplies.warning_id)
      : []

    const byId = new Map(counts.map((c) => [c.wid, c]))

    return rows.map((r) => {
      const c = byId.get(r.id)
      const lastReply = c?.last ? new Date(c.last) : null
      const lastActivity =
        lastReply && lastReply > r.createdAt ? lastReply : r.createdAt
      return {
        id: r.id,
        message: r.value,
        sentAt: r.createdAt.toISOString(),
        replyCount: Number(c?.c ?? 0),
        lastActivityAt: lastActivity.toISOString(),
      }
    })
  },
)

// ── خيط تنبيه واحد: التنبيه + كل الردود (للمستخدم صاحبه أو لأي أدمن) ──
export interface WarningReplyView {
  id: string
  authorRole: string
  authorName: string
  body: string
  createdAt: string
  isMine: boolean
}
export interface WarningThread {
  warningId: string
  message: string
  sentAt: string
  targetUserId: string
  targetName: string
  replies: WarningReplyView[]
}

async function loadWarningForAccess(warningId: string, session: {
  user: { id: string; role: string }
}): Promise<{ message: string; sentAt: Date; targetUserId: string }> {
  const [w] = await db
    .select({
      identifier: verifications.identifier,
      value: verifications.value,
      createdAt: verifications.createdAt,
    })
    .from(verifications)
    .where(eq(verifications.id, warningId))
    .limit(1)

  if (!w || !w.identifier.startsWith(WARN_PREFIX)) {
    throw new Error('التنبيه غير موجود')
  }
  const targetUserId = w.identifier.slice(WARN_PREFIX.length)
  // مصرّح: الأدمن أو صاحب التنبيه فقط
  if (session.user.role !== 'super_admin' && session.user.id !== targetUserId) {
    throw new Error('غير مصرّح')
  }
  return { message: w.value, sentAt: w.createdAt, targetUserId }
}

export const getWarningThread = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ warningId: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<WarningThread> => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const w = await loadWarningForAccess(data.warningId, session)

    const [target] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, w.targetUserId))
      .limit(1)

    const replies = await db
      .select({
        id: warningReplies.id,
        authorRole: warningReplies.author_role,
        authorUserId: warningReplies.author_user_id,
        authorName: users.name,
        body: warningReplies.body,
        createdAt: warningReplies.created_at,
      })
      .from(warningReplies)
      .innerJoin(users, eq(users.id, warningReplies.author_user_id))
      .where(eq(warningReplies.warning_id, data.warningId))
      .orderBy(asc(warningReplies.created_at))

    return {
      warningId: data.warningId,
      message: w.message,
      sentAt: w.sentAt.toISOString(),
      targetUserId: w.targetUserId,
      targetName: target?.name ?? '—',
      replies: replies.map((r) => ({
        id: r.id,
        authorRole: r.authorRole,
        authorName: r.authorName,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        isMine: r.authorUserId === session.user.id,
      })),
    }
  })

// ── إضافة ردّ (من المستخدم المُنذَر أو من الأدمن) + إشعار الطرف الآخر ──
export const replyToWarning = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        warningId: z.string().min(1),
        body: z.string().trim().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const w = await loadWarningForAccess(data.warningId, session)

    await db.insert(warningReplies).values({
      warning_id: data.warningId,
      target_user_id: w.targetUserId,
      author_user_id: session.user.id,
      author_role: session.user.role as 'super_admin' | 'merchant' | 'affiliate',
      body: data.body.trim(),
    })

    const preview = data.body.trim().slice(0, 140)

    if (session.user.role === 'super_admin') {
      // الأدمن ردّ → أشعر المستخدم صاحب التنبيه
      const [target] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, w.targetUserId))
        .limit(1)
      await notify({
        userId: w.targetUserId,
        type: 'system',
        title: '💬 ردّت الإدارة على تنبيهك',
        body: preview,
        link: roleNotificationsPath(target?.role ?? 'affiliate'),
      })
    } else {
      // المستخدم ردّ → أشعر كل الأدمن
      await notifySuperAdmins({
        type: 'system',
        title: `💬 ردّ ${roleLabel(session.user.role)} على تنبيه`,
        body: preview,
        link: roleAdminPath(session.user.role),
      })
    }

    return { success: true }
  })
