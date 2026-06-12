// merchant/settings/-server/settings.api.ts

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '#/server/db'
import { auth } from '#/server/auth'
import { requireMerchant } from '#/server/auth/guards'
import {
  merchantProfiles,
  users,
  sessions,
  settings,
  withdrawalRequests,
} from '#/server/db/schema'
import { and, eq, ne, desc } from 'drizzle-orm'
import { z } from 'zod'
import type {
  SettingsData,
  PayoutAccount,
  ActiveSession,
  SessionDevice,
  NotificationToggles,
} from '../-settings.types'

// ── تخزين تفضيلات الإشعارات في جدول settings (مفتاح/قيمة) ───────
// لا يوجد جدول تفضيلات مخصّص؛ نخزّن JSON تحت مفتاح يحمل معرّف المستخدم.
type StoredMerchantNotif = {
  toggles: NotificationToggles
  channels: { email: string; whatsapp: string }
}
const merchantNotifKey = (userId: string) => `merchant_notif:${userId}`

async function readMerchantNotif(userId: string): Promise<StoredMerchantNotif | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, merchantNotifKey(userId)))
    .limit(1)
  if (!row) return null
  try {
    return JSON.parse(row.value) as StoredMerchantNotif
  } catch {
    return null
  }
}

// ============================================================
// HELPERS
// ============================================================

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  CCP: 'CCP / بريد الجزائر',
  BaridiMob: 'BaridiMob',
}

function parseUserAgent(ua: string | null): { browser: string; device: SessionDevice } {
  const agent = ua ?? ''
  const device: SessionDevice = /Mobile/i.test(agent)
    ? 'mobile'
    : /Tablet|iPad/i.test(agent)
      ? 'tablet'
      : 'desktop'
  const browser = /Firefox/i.test(agent)
    ? 'Firefox'
    : /Edg/i.test(agent)
      ? 'Edge'
      : /Chrome/i.test(agent)
        ? 'Chrome'
        : /Safari/i.test(agent)
          ? 'Safari'
          : 'متصفح'
  return { browser, device }
}

function formatLastActive(d: Date): string {
  return d.toLocaleDateString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================
// GET SETTINGS DATA
// ============================================================

export const getSettingsData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SettingsData> => {
    const { session } = await requireMerchant()
    const userId = session.user.id
    const currentToken = session.session.token

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const [mp] = await db
      .select()
      .from(merchantProfiles)
      .where(eq(merchantProfiles.user_id, userId))
      .limit(1)

    // payout accounts derived from past withdrawal requests
    const pastWithdrawals = await db
      .select({
        method: withdrawalRequests.method,
        accountNumber: withdrawalRequests.account_number,
        requestedAt: withdrawalRequests.requested_at,
      })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.user_id, userId))
      .orderBy(desc(withdrawalRequests.requested_at))

    const seen = new Set<string>()
    const accounts: PayoutAccount[] = []
    for (const w of pastWithdrawals) {
      const key = `${w.method}:${w.accountNumber}`
      if (seen.has(key)) continue
      seen.add(key)
      accounts.push({
        id: key,
        type: w.method,
        label: PAYOUT_METHOD_LABEL[w.method] ?? w.method,
        detail: w.accountNumber,
        isDefault: accounts.length === 0,
      })
    }

    const [minPayout] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, 'minimum_payout'))
      .limit(1)

    // active sessions
    const userSessions = await db
      .select({
        id: sessions.id,
        token: sessions.token,
        userAgent: sessions.userAgent,
        ipAddress: sessions.ipAddress,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))

    const sessionList: ActiveSession[] = userSessions.map((s) => {
      const { browser, device } = parseUserAgent(s.userAgent)
      return {
        id: s.id,
        browser,
        location: s.ipAddress ?? '—',
        device,
        lastActive: formatLastActive(s.updatedAt ?? s.createdAt),
        ip: s.ipAddress ?? '—',
        isCurrent: s.token === currentToken,
      }
    })

    // تفضيلات الإشعارات المحفوظة (أو الافتراضية)
    const DEFAULT_TOGGLES: NotificationToggles = {
      newOrders: true,
      paymentConfirmation: true,
      weeklyReport: false,
      returnRateAlert: true,
      affiliateActivity: false,
    }
    const storedNotif = await readMerchantNotif(userId)

    return {
      profile: {
        profile: {
          fullName: user?.name ?? '',
          email: user?.email ?? '',
          phone: user?.phone ?? '',
          storeName: mp?.business_name ?? '',
        },
        pickup: {
          wilaya: user?.wilaya ?? '',
          commune: '',
          address: mp?.address ?? '',
        },
      },
      payout: {
        accounts,
        minimumPayout: minPayout ? Number(minPayout.value) : 5000,
      },
      notifications: {
        toggles: storedNotif?.toggles ?? DEFAULT_TOGGLES,
        channels: storedNotif?.channels ?? {
          email: user?.email ?? '',
          whatsapp: user?.phone ?? '',
        },
      },
      security: {
        sessions: sessionList,
      },
    }
  },
)

// ============================================================
// UPDATE PROFILE
// ============================================================

const ProfileSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  wilaya: z.string().optional(),
  storeName: z.string().min(1),
  address: z.string().optional(),
})

export const updateProfile = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { session } = await requireMerchant()
    const userId = session.user.id

    await db
      .update(users)
      .set({
        name: data.name,
        phone: data.phone ?? null,
        wilaya: data.wilaya ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    await db
      .update(merchantProfiles)
      .set({ business_name: data.storeName, address: data.address ?? null })
      .where(eq(merchantProfiles.user_id, userId))

    return { success: true }
  })

// ============================================================
// UPDATE NOTIFICATIONS — يُحفظ في تفضيلات المستخدم (جدول settings)
// ============================================================

const MerchantNotifSchema = z.object({
  toggles: z.object({
    newOrders: z.boolean(),
    paymentConfirmation: z.boolean(),
    weeklyReport: z.boolean(),
    returnRateAlert: z.boolean(),
    affiliateActivity: z.boolean(),
  }),
  channels: z.object({
    email: z.string(),
    whatsapp: z.string(),
  }),
})

export const updateNotifications = createServerFn({ method: 'POST' })
  .validator((input: unknown) => MerchantNotifSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { session } = await requireMerchant()

    await db
      .insert(settings)
      .values({
        key: merchantNotifKey(session.user.id),
        value: JSON.stringify(data),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: JSON.stringify(data), updated_at: new Date() },
      })

    return { success: true }
  })

// ============================================================
// UPDATE PASSWORD
// ============================================================

export const updatePassword = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({ currentPassword: z.string(), newPassword: z.string().min(8) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    await requireMerchant()
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        headers: getRequest().headers,
      })
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'فشل تحديث كلمة المرور',
      }
    }
  })

// ============================================================
// TERMINATE SESSION
// ============================================================

export const terminateSession = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ sessionId: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { session } = await requireMerchant()
    await db
      .delete(sessions)
      .where(and(eq(sessions.id, data.sessionId), eq(sessions.userId, session.user.id)))
    return { success: true }
  })

// ============================================================
// TERMINATE ALL OTHER SESSIONS
// ============================================================

export const terminateAllSessions = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean }> => {
    const { session } = await requireMerchant()
    const current = await auth.api.getSession({ headers: getRequest().headers })
    const currentId = current?.session.id

    await db
      .delete(sessions)
      .where(
        currentId
          ? and(eq(sessions.userId, session.user.id), ne(sessions.id, currentId))
          : eq(sessions.userId, session.user.id),
      )
    return { success: true }
  },
)

// ============================================================
// REQUEST ACCOUNT DELETION (soft delete)
// ============================================================

export const requestAccountDeletion = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean }> => {
    const { session } = await requireMerchant()
    const now = new Date()
    await Promise.all([
      db.update(users).set({ deleted_at: now }).where(eq(users.id, session.user.id)),
      db
        .update(merchantProfiles)
        .set({ deleted_at: now })
        .where(eq(merchantProfiles.user_id, session.user.id)),
    ])
    return { success: true }
  },
)
