// ============================================================
// affiliate/settings/-server/settings.api.ts
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '#/server/db'
import { auth } from '#/server/auth'
import { getSession } from '#/lib/session'
import {
  affiliateProfiles,
  users,
  sessions,
  withdrawalRequests,
  settings,
} from '#/server/db/schema'
import { and, eq, ne, desc } from 'drizzle-orm'
import { z } from 'zod'
import type {
  SettingsData,
  PayoutMethod,
  ActiveSession,
  NotificationSettings,
  SocialLinks,
} from '../-settings.types'

// ── تخزين تفضيلات المستخدم في جدول settings (مفتاح/قيمة) ────────
// لا يوجد جدول تفضيلات مخصّص؛ نخزّن قيمة JSON تحت مفتاح يحمل معرّف المستخدم.
// قراءة دفاعية: أي قيمة تالفة تُعاد كـ null فتُستخدم القيم الافتراضية.
async function readUserPref<T>(key: string): Promise<T | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1)
  if (!row) return null
  try {
    return JSON.parse(row.value) as T
  } catch {
    return null
  }
}

async function writeUserPref(key: string, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value: JSON.stringify(value) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: JSON.stringify(value), updated_at: new Date() },
    })
}

const socialKey = (userId: string) => `affiliate_social:${userId}`
const notifKey = (userId: string) => `affiliate_notif:${userId}`

// ============================================================
// HELPERS
// ============================================================

async function requireAffiliate() {
  const session = await getSession()
  if (!session || session.user.role !== 'affiliate')
    throw new Error('Unauthorized')

  const [profile] = await db
    .select({ id: affiliateProfiles.id, referralCode: affiliateProfiles.referral_code })
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.user_id, session.user.id))
    .limit(1)

  if (!profile) throw new Error('Affiliate profile not found')
  return { session, profileId: profile.id, referralCode: profile.referralCode }
}

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  CCP: 'CCP — بريد الجزائر',
  BaridiMob: 'BaridiMob',
}

function parseUserAgent(ua: string | null): string {
  const agent = ua ?? ''
  const deviceAr = /Mobile/i.test(agent)
    ? 'هاتف'
    : /Tablet|iPad/i.test(agent)
      ? 'جهاز لوحي'
      : 'حاسوب'
  const browser = /Firefox/i.test(agent)
    ? 'Firefox'
    : /Edg/i.test(agent)
      ? 'Edge'
      : /Chrome/i.test(agent)
        ? 'Chrome'
        : /Safari/i.test(agent)
          ? 'Safari'
          : 'متصفح'
  return `${browser} — ${deviceAr}`
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  doNotDisturb: false,
  preferences: [
    { id: 'notif-01', label: 'عمولة جديدة', description: 'عند تسجيل عمولة من طلبية مؤكدة', channels: { email: true, platform: true } },
    { id: 'notif-02', label: 'تحديث حالة الطلبية', description: 'عند تغير حالة الطلبية (مشحونة → مُسلّمة)', channels: { email: false, platform: true } },
    { id: 'notif-03', label: 'تحويل الأموال', description: 'عند إتمام تحويل الأموال إلى حسابك', channels: { email: true, platform: true } },
    { id: 'notif-04', label: 'منتجات جديدة', description: 'عند إضافة منتجات جديدة في السوق', channels: { email: false, platform: false } },
    { id: 'notif-05', label: 'طلب سحب مرفوض', description: 'عند رفض طلب سحب الأموال مع ذكر السبب', channels: { email: true, platform: true } },
  ],
}

// الشكل المُخزَّن المُدمَج: علم عدم الإزعاج + قنوات كل تفضيل حسب معرّفه.
// نخزّن الاختيارات فقط (لا العناوين/الأوصاف — تبقى مصدرها الخادم).
type StoredNotif = {
  doNotDisturb: boolean
  channels: Record<string, { email: boolean; platform: boolean }>
}

function mergeNotifications(stored: StoredNotif | null): NotificationSettings {
  if (!stored || typeof stored !== 'object') return DEFAULT_NOTIFICATIONS
  return {
    doNotDisturb: Boolean(stored.doNotDisturb),
    preferences: DEFAULT_NOTIFICATIONS.preferences.map((p) => {
      const c = stored.channels?.[p.id]
      return c
        ? { ...p, channels: { email: Boolean(c.email), platform: Boolean(c.platform) } }
        : p
    }),
  }
}

// ============================================================
// GET SETTINGS DATA
// ============================================================

export const getSettingsData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SettingsData> => {
    const { session, referralCode } = await requireAffiliate()
    const userId = session.user.id
    const currentToken = session.session.token

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    // طرق الدفع مشتقّة من طلبات السحب السابقة
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
    const payoutMethods: PayoutMethod[] = []
    for (const w of pastWithdrawals) {
      const key = `${w.method}:${w.accountNumber}`
      if (seen.has(key)) continue
      seen.add(key)
      payoutMethods.push({
        id: key,
        type: w.method,
        label: PAYOUT_METHOD_LABEL[w.method] ?? w.method,
        detail: w.accountNumber,
        isDefault: payoutMethods.length === 0,
      })
    }

    // الجلسات النشطة
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

    const sessionList: ActiveSession[] = userSessions.map((s) => ({
      id: s.id,
      device: parseUserAgent(s.userAgent),
      location: '—',
      ip: s.ipAddress ?? '—',
      lastActive: (s.updatedAt ?? s.createdAt).toISOString(),
      isCurrent: s.token === currentToken,
    }))

    // تفضيلات محفوظة (روابط التواصل + الإشعارات) — أو القيم الافتراضية
    const storedSocial = (await readUserPref<SocialLinks>(socialKey(userId))) ?? {}
    const storedNotif = await readUserPref<StoredNotif>(notifKey(userId))

    return {
      profile: {
        id: userId,
        fullName: user?.name ?? '',
        username: referralCode,
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        avatarUrl: user?.image ?? undefined,
        socialLinks: storedSocial,
        joinedAt: (user?.approved_at ?? user?.createdAt ?? new Date()).toISOString(),
      },
      payoutMethods,
      notifications: mergeNotifications(storedNotif),
      security: {
        sessions: sessionList,
        twoFactorEnabled: false,
        referralCode,
      },
    }
  },
)

// ============================================================
// UPDATE PROFILE (يحفظ الاسم والهاتف)
// ============================================================

const ProfileSchema = z.object({
  fullName: z.string().min(1),
  username: z.string().optional(),
  phone: z.string().optional(),
  socialLinks: z
    .object({
      tiktok: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
    })
    .optional(),
})

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { session } = await requireAffiliate()

    // الاسم والهاتف على جدول المستخدمين؛ اسم المستخدم = رمز الإحالة (غير قابل
    // للتغيير من هنا) فلا نلمسه.
    await db
      .update(users)
      .set({
        name: data.fullName,
        phone: data.phone ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    // روابط التواصل تُحفظ في تفضيلات المستخدم (لا عمود مخصّص لها)
    if (data.socialLinks) {
      await writeUserPref(socialKey(session.user.id), {
        tiktok: data.socialLinks.tiktok?.trim() || undefined,
        facebook: data.socialLinks.facebook?.trim() || undefined,
        instagram: data.socialLinks.instagram?.trim() || undefined,
      })
    }

    return { success: true }
  })

// ============================================================
// UPDATE NOTIFICATIONS — يُحفظ في تفضيلات المستخدم (جدول settings)
// ============================================================

const NotifSaveSchema = z.object({
  doNotDisturb: z.boolean(),
  preferences: z.array(
    z.object({
      id: z.string(),
      channels: z.object({ email: z.boolean(), platform: z.boolean() }),
    }),
  ),
})

export const updateNotifications = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => NotifSaveSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { session } = await requireAffiliate()

    // نخزّن الاختيارات فقط (علم عدم الإزعاج + قنوات كل تفضيل حسب معرّفه)
    const channels: StoredNotif['channels'] = {}
    for (const p of data.preferences) channels[p.id] = p.channels

    await writeUserPref(notifKey(session.user.id), {
      doNotDisturb: data.doNotDisturb,
      channels,
    })

    return { success: true }
  })

// ============================================================
// CHANGE PASSWORD
// ============================================================

export const changePassword = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
        confirmPassword: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    await requireAffiliate()

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'كلمتا المرور غير متطابقتين' }
    }

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
// REVOKE ALL OTHER SESSIONS
// ============================================================

export const revokeAllSessions = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean }> => {
    const { session } = await requireAffiliate()
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
