// src/routes/_dashboard/affiliates/-server/affiliates.api.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { auth, setInviteType } from '#/server/auth'
import { requireSuperAdmin } from '#/server/auth/guards'
import { notify } from '#/server/notify'
import { z } from 'zod'
import {
  users,
  affiliateProfiles,
  orders,
  wallets,
  verifications,
} from '#/server/db/schema'
import { eq, and, isNull, sql, desc, inArray } from 'drizzle-orm'
import type {
  Affiliate,
  AffiliateWarning,
  AffiliateStats,
  AffiliatesData,
  JoinRequest,
} from '../-affiliates.types'

// ============================================================
// HELPERS
// ============================================================

function growthRate(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0
  return Math.round(((current - previous) / previous) * 100)
}

function getMonthRanges() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return {
    t0: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    t1: new Date(Date.UTC(year, month, 1)).toISOString(),
    t2: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
  }
}

// ============================================================
// STATS
// ============================================================

async function fetchAffiliateStats(): Promise<AffiliateStats> {
  const { t0, t1, t2 } = getMonthRanges()

  const [r] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      active: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'active')`,
      suspended: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'suspended')`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'pending')`,
      newTotal: sql<number>`COUNT(*) FILTER (WHERE ${users.createdAt} >= ${t1}::timestamptz AND ${users.createdAt} < ${t2}::timestamptz)`,
      newTotalPrev: sql<number>`COUNT(*) FILTER (WHERE ${users.createdAt} >= ${t0}::timestamptz AND ${users.createdAt} < ${t1}::timestamptz)`,
    })
    .from(users)
    .innerJoin(affiliateProfiles, eq(affiliateProfiles.user_id, users.id))
    .where(
      and(
        isNull(users.deleted_at),
        isNull(affiliateProfiles.deleted_at),
        eq(users.role, 'affiliate'),
      ),
    )

  const n = (v: unknown) => Number(v ?? 0)
  return {
    total: {
      value: n(r.total),
      newThisMonth: n(r.newTotal),
      changeVsPrev: growthRate(n(r.newTotal), n(r.newTotalPrev)),
    },
    active: { value: n(r.active), newThisMonth: 0, changeVsPrev: null },
    suspended: { value: n(r.suspended), newThisMonth: 0, changeVsPrev: null },
    pending: { value: n(r.pending), newThisMonth: 0, changeVsPrev: null },
  }
}

// ============================================================
// AFFILIATES LIST
// ============================================================

async function fetchAffiliates(): Promise<Affiliate[]> {
  // CTE: مجموع الطلبات والعمولات لكل مسوق
  const ordersAgg = db.$with('orders_agg').as(
    db
      .select({
        affiliateId: orders.affiliate_id,
        totalOrders: sql<number>`COUNT(*)`.as('total_orders'),
        // العمولة تُكتسب فقط عند التسليم — نحسب المُسلَّمة فقط (لا المؤكَّدة/قيد الشحن)
        // كي تطابق ما يراه المسوّق في بوابته ولا نعرض عمولة على طلب لم يُسلَّم بعد.
        totalCommissions: sql<number>`COALESCE(SUM(
        GREATEST((${orders.unit_affiliate_price_dzd} - ${orders.unit_merchant_price_dzd}) * ${orders.quantity} - ${orders.platform_fee_affiliate_dzd} - ${orders.shipping_fee_dzd}, 0)
      ) FILTER (WHERE ${orders.status} = 'delivered'), 0)`.as('total_commissions'),
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, [
            'confirmed',
            'shipped',
            'at_wilaya',
            'delivered',
          ]),
          sql`${orders.affiliate_id} IS NOT NULL`,
        ),
      )
      .groupBy(orders.affiliate_id),
  )

  // CTE: العمولات المعلقة (pending في المحفظة)
  const pendingAgg = db.$with('pending_agg').as(
    db
      .select({
        userId: wallets.user_id,
        pendingBalance: wallets.pending_balance_dzd,
      })
      .from(wallets),
  )

  const rows = await db
    .with(ordersAgg, pendingAgg)
    .select({
      id: affiliateProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      wilaya: users.wilaya,
      referralCode: affiliateProfiles.referral_code,
      refusalRate: affiliateProfiles.refusal_rate,
      fraudFlag: affiliateProfiles.fraud_flag,
      status: users.status,
      joinedAt: users.approved_at,
      createdAt: users.createdAt,
      // عدد الحملات = عدد tracking links النشطة
      totalCampaigns: sql<number>`COALESCE((
        SELECT COUNT(*) FROM tracking_links tl
        WHERE tl.affiliate_id = ${affiliateProfiles.id}
        AND tl.is_active = true
      ), 0)`.as('total_campaigns'),
      totalOrders: sql<number>`COALESCE(${ordersAgg.totalOrders}, 0)`.as(
        'total_orders',
      ),
      totalCommissions:
        sql<number>`COALESCE(${ordersAgg.totalCommissions}, 0)`.as(
          'total_commissions',
        ),
      pendingCommissions:
        sql<number>`COALESCE(${pendingAgg.pendingBalance}, 0)`.as(
          'pending_commissions',
        ),
    })
    .from(users)
    .innerJoin(affiliateProfiles, eq(affiliateProfiles.user_id, users.id))
    .leftJoin(ordersAgg, eq(ordersAgg.affiliateId, affiliateProfiles.id))
    .leftJoin(pendingAgg, eq(pendingAgg.userId, users.id))
    .where(
      and(
        eq(users.role, 'affiliate'),
        isNull(users.deleted_at),
        isNull(affiliateProfiles.deleted_at),
      ),
    )
    .orderBy(desc(users.createdAt))

  if (rows.length === 0) return []

  const userIds = rows.map((r) => r.userId)

  // جلب الإنذارات
  const warningRows = await db
    .select({
      id: verifications.id,
      identifier: verifications.identifier,
      value: verifications.value,
      createdAt: verifications.createdAt,
    })
    .from(verifications)
    .where(
      inArray(
        verifications.identifier,
        userIds.map((uid) => `warning:${uid}`),
      ),
    )
    .orderBy(desc(verifications.createdAt))

  const warningsByUserId = new Map<string, AffiliateWarning[]>()
  for (const w of warningRows) {
    const uid = w.identifier.replace('warning:', '')
    const list = warningsByUserId.get(uid) ?? []
    list.push({
      id: w.id,
      message: w.value,
      sentAt: w.createdAt.toISOString().split('T')[0],
    })
    warningsByUserId.set(uid, list)
  }

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.name,
    email: r.email,
    phone: r.phone ?? '—',
    wilaya: r.wilaya ?? '—',
    referralCode: r.referralCode,
    refusalRate: Number(r.refusalRate ?? 0),
    fraudFlag: r.fraudFlag,
    status: r.status as Affiliate['status'],
    joinedAt: (r.joinedAt ?? r.createdAt).toISOString().split('T')[0],
    totalCampaigns: Number(r.totalCampaigns),
    totalOrders: Number(r.totalOrders),
    totalCommissions: Number(r.totalCommissions),
    pendingCommissions: Number(r.pendingCommissions),
    warnings: warningsByUserId.get(r.userId) ?? [],
  }))
}

// ============================================================
// JOIN REQUESTS
// ============================================================

async function fetchJoinRequests(): Promise<JoinRequest[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      wilaya: users.wilaya,
      requestedAt: users.createdAt,
    })
    .from(users)
    .leftJoin(affiliateProfiles, eq(affiliateProfiles.user_id, users.id))
    .where(
      and(
        eq(users.role, 'affiliate'),
        eq(users.status, 'pending'),
        isNull(users.deleted_at),
      ),
    )
    .orderBy(desc(users.createdAt))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? '—',
    wilaya: r.wilaya ?? '—',
    businessName: r.name,
    category: 'مسوق',
    requestedAt: r.requestedAt.toISOString().split('T')[0],
    status: 'pending' as const,
  }))
}

// ============================================================
// GET DATA
// ============================================================

export const getAffiliatesData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AffiliatesData> => {
    await requireSuperAdmin()
    const [stats, affiliatesList, joinRequests] = await Promise.all([
      fetchAffiliateStats(),
      fetchAffiliates(),
      fetchJoinRequests(),
    ])
    return { stats, affiliates: affiliatesList, joinRequests }
  },
)

// ============================================================
// ACCEPT JOIN REQUEST
// ============================================================

export const acceptAffiliateRequest = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ userId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()

    await db
      .update(users)
      .set({ status: 'active', approved_at: new Date() })
      .where(eq(users.id, data.userId))

    // إنشاء affiliate_profile إذا لم يكن موجوداً
    const existing = await db
      .select({ id: affiliateProfiles.id })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.user_id, data.userId))
      .limit(1)

    if (existing.length === 0) {
      // إنشاء referral code فريد من اسم المستخدم + random
      const [u] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1)

      const slug = (u?.name ?? 'af')
        .replace(/\s+/g, '')
        .toLowerCase()
        .slice(0, 6)

      const referralCode = `${slug}-${Math.random().toString(36).slice(2, 6)}`

      await db.insert(affiliateProfiles).values({
        user_id: data.userId,
        referral_code: referralCode,
      })
    }

    return { success: true }
  })

// ============================================================
// REJECT JOIN REQUEST
// ============================================================

export const rejectAffiliateRequest = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ userId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    await db
      .update(users)
      .set({ status: 'suspended', deleted_at: new Date() })
      .where(eq(users.id, data.userId))
    return { success: true }
  })

// ============================================================
// UPDATE AFFILIATE STATUS
// ============================================================

export const updateAffiliateStatus = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        affiliateId: z.string().uuid(),
        status: z.enum(['active', 'suspended']),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const [profile] = await db
      .select({ userId: affiliateProfiles.user_id })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, data.affiliateId))
      .limit(1)
    if (!profile) throw new Error('Affiliate not found')
    await db
      .update(users)
      .set({ status: data.status })
      .where(eq(users.id, profile.userId))
    return { success: true }
  })

// ============================================================
// SEND AFFILIATE WARNING
// ============================================================

export const sendAffiliateWarning = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        affiliateId: z.string().uuid(),
        message: z.string().trim().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    if (!data.message.trim()) throw new Error('Warning message is required')

    const [profile] = await db
      .select({ userId: affiliateProfiles.user_id })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, data.affiliateId))
      .limit(1)
    if (!profile) throw new Error('Affiliate not found')

    const [warning] = await db
      .insert(verifications)
      .values({
        id: crypto.randomUUID(),
        identifier: `warning:${profile.userId}`,
        value: data.message.trim(),
        expiresAt: new Date('9999-12-31'),
      })
      .returning({
        id: verifications.id,
        createdAt: verifications.createdAt,
      })

    // إشعار المسوّق فعلياً بالتحذير (وإلا بقي مخزّناً للأدمن فقط ولم يصله شيء)
    await notify({
      userId: profile.userId,
      type: 'system',
      title: '⚠️ تنبيه من إدارة المنصّة',
      body: data.message.trim(),
      link: '/affiliate/notifications',
    })

    return {
      success: true,
      warning: {
        id: warning.id,
        sentAt: warning.createdAt.toISOString().split('T')[0],
      },
    }
  })

// ============================================================
// DELETE AFFILIATE
// ============================================================

export const deleteAffiliate = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ affiliateId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const [profile] = await db
      .select({ userId: affiliateProfiles.user_id })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, data.affiliateId))
      .limit(1)
    if (!profile) throw new Error('Affiliate not found')

    const now = new Date()
    await Promise.all([
      db
        .update(users)
        .set({ deleted_at: now })
        .where(eq(users.id, profile.userId)),
      db
        .update(affiliateProfiles)
        .set({ deleted_at: now })
        .where(eq(affiliateProfiles.id, data.affiliateId)),
    ])
    return { success: true }
  })

// ============================================================
// INVITE AFFILIATE
// ============================================================

const InviteAffiliateSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(9, 'رقم الهاتف غير صحيح'),
})

export type InviteAffiliateInput = z.infer<typeof InviteAffiliateSchema>

export const inviteAffiliate = createServerFn({ method: 'POST' })
  .validator((input: unknown) => InviteAffiliateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()

    const email = data.email.toLowerCase().trim()

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing) throw new Error('هذا البريد الإلكتروني مستخدم مسبقاً')

    const userId = crypto.randomUUID()
    const slug = data.name.replace(/\s+/g, '').toLowerCase().slice(0, 6)
    const referralCode = `${slug}-${Math.random().toString(36).slice(2, 6)}`

    // 1. إنشاء المستخدم والملف معاً قبل إرسال الإيميل
    await db.insert(users).values({
      id: userId,
      name: data.name,
      email,
      phone: data.phone,
      emailVerified: true,
      role: 'affiliate',
      status: 'active',
    })

    await db.insert(affiliateProfiles).values({
      user_id: userId,
      referral_code: referralCode,
    })

    // 2. إرسال magic link — وعند الفشل نظّف كل شيء بالترتيب الصحيح
    try {
      setInviteType(email, 'affiliate')
      await auth.api.signInMagicLink({
        body: { email, callbackURL: '/set-password' },
        headers: new Headers(),
      })
    } catch (err) {
      // الحذف بالترتيب: profile أولاً (FK)، ثم user
      await db
        .delete(affiliateProfiles)
        .where(eq(affiliateProfiles.user_id, userId))
      await db.delete(users).where(eq(users.id, userId))

      console.error('inviteAffiliate — signInMagicLink error:', err)
      throw new Error('فشل إرسال البريد الإلكتروني، حاول مرة أخرى')
    }

    return { success: true, userId, referralCode }
  })
