// src/routes/_dashboard/merchants/-server/merchants.api.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { auth, setInviteType } from '#/server/auth'
import { requireSuperAdmin } from '#/server/auth/guards'
import { z } from 'zod'
import {
  users,
  merchantProfiles,
  products,
  orders,
  settings,
  verifications,
} from '#/server/db/schema'
import { eq, and, isNull, sql, desc, inArray } from 'drizzle-orm'
import type {
  Merchant,
  MerchantProduct,
  MerchantWarning,
  MerchantStats,
  MerchantsData,
  JoinRequest,
} from '../-merchants.types'

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

async function fetchMerchantStats(): Promise<MerchantStats> {
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
    .innerJoin(merchantProfiles, eq(merchantProfiles.user_id, users.id))
    .where(
      and(
        isNull(users.deleted_at),
        isNull(merchantProfiles.deleted_at),
        eq(users.role, 'merchant'),
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
// DEFAULT COMMISSION RATE
// ============================================================

async function fetchDefaultCommissionRate(): Promise<number> {
  const row = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'default_commission_rate'))
    .limit(1)
  return row[0] ? Number(row[0].value) : 5
}

// ============================================================
// MERCHANTS LIST
// ============================================================

async function fetchMerchants(
  defaultCommissionRate: number,
): Promise<Merchant[]> {
  const ordersAgg = db.$with('orders_agg').as(
    db
      .select({
        merchantId: orders.merchant_id,
        totalOrders: sql<number>`COUNT(*)`.as('total_orders'),
        totalRevenue:
          sql<number>`COALESCE(SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity}), 0)`.as(
            'total_revenue',
          ),
      })
      .from(orders)
      .where(
        inArray(orders.status, [
          'confirmed',
          'shipped',
          'at_wilaya',
          'delivered',
        ]),
      )
      .groupBy(orders.merchant_id),
  )

  const rows = await db
    .with(ordersAgg)
    .select({
      id: merchantProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      wilaya: users.wilaya,
      businessName: merchantProfiles.business_name,
      status: users.status,
      joinedAt: users.approved_at,
      createdAt: users.createdAt,
      totalProducts:
        sql<number>`COALESCE((SELECT COUNT(*) FROM products p WHERE p.merchant_id = ${merchantProfiles.id} AND p.deleted_at IS NULL), 0)`.as(
          'total_products',
        ),
      totalOrders: sql<number>`COALESCE(${ordersAgg.totalOrders},  0)`.as(
        'total_orders',
      ),
      totalRevenue: sql<number>`COALESCE(${ordersAgg.totalRevenue}, 0)`.as(
        'total_revenue',
      ),
    })
    .from(users)
    .innerJoin(merchantProfiles, eq(merchantProfiles.user_id, users.id))
    .leftJoin(ordersAgg, eq(ordersAgg.merchantId, merchantProfiles.id))
    .where(
      and(
        eq(users.role, 'merchant'),
        isNull(users.deleted_at),
        isNull(merchantProfiles.deleted_at),
      ),
    )
    .orderBy(desc(users.createdAt))

  if (rows.length === 0) return []

  const merchantIds = rows.map((r) => r.id)
  const userIds = rows.map((r) => r.userId)

  const productRows = await db
    .select({
      id: products.id,
      merchantId: products.merchant_id,
      name: products.name,
      price: products.merchant_price_dzd,
      stock: products.stock_qty,
      category: products.category,
      isActive: products.is_active,
    })
    .from(products)
    .where(
      and(
        inArray(products.merchant_id, merchantIds),
        isNull(products.deleted_at),
      ),
    )
    .orderBy(desc(products.created_at))

  const productsByMerchant = new Map<string, MerchantProduct[]>()
  for (const p of productRows) {
    const list = productsByMerchant.get(p.merchantId) ?? []
    if (list.length < 3) {
      list.push({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category ?? '—',
        status: p.isActive ? 'active' : 'inactive',
      })
      productsByMerchant.set(p.merchantId, list)
    }
  }

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

  const warningsByUserId = new Map<string, MerchantWarning[]>()
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
    name: r.name,
    email: r.email,
    phone: r.phone ?? '—',
    wilaya: r.wilaya ?? '—',
    businessName: r.businessName,
    status: r.status as Merchant['status'],
    joinedAt: (r.joinedAt ?? r.createdAt).toISOString().split('T')[0],
    totalProducts: Number(r.totalProducts),
    totalOrders: Number(r.totalOrders),
    totalRevenue: Number(r.totalRevenue),
    commissionRate: defaultCommissionRate,
    products: productsByMerchant.get(r.id) ?? [],
    warnings: warningsByUserId.get(r.userId) ?? [],
  }))
}

// ============================================================
// JOIN REQUESTS
// ============================================================

async function fetchJoinRequests(): Promise<JoinRequest[]> {
  const rows = await db
    .select({
      // المعرّف يجب أن يكون user.id لأنّ accept/reject يعملان على المستخدم
      // (لا merchant_profile.id الذي ينشئه hook التسجيل تلقائياً)
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      wilaya: users.wilaya,
      businessName: sql<string>`COALESCE(${merchantProfiles.business_name}, ${users.name})`,
      requestedAt: users.createdAt,
      address: merchantProfiles.address,
    })
    .from(users)
    .leftJoin(merchantProfiles, eq(merchantProfiles.user_id, users.id))
    .where(
      and(
        eq(users.role, 'merchant'),
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
    businessName: r.businessName,
    category: '—',
    requestedAt: r.requestedAt.toISOString().split('T')[0],
    description: r.address ?? '',
    registrationNumber: '—',
    status: 'pending' as const,
  }))
}

// ============================================================
// GET DATA
// ============================================================

export const getMerchantsData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MerchantsData> => {
    await requireSuperAdmin()
    const defaultCommissionRate = await fetchDefaultCommissionRate()
    const [stats, merchantsList, joinRequests] = await Promise.all([
      fetchMerchantStats(),
      fetchMerchants(defaultCommissionRate),
      fetchJoinRequests(),
    ])
    return { stats, merchants: merchantsList, joinRequests }
  },
)

// ============================================================
// ACCEPT JOIN REQUEST
// ============================================================

export const acceptJoinRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().min(1),
        businessName: z.string().trim().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    await db
      .update(users)
      .set({ status: 'active', approved_at: new Date() })
      .where(eq(users.id, data.userId))
    const existing = await db
      .select({ id: merchantProfiles.id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.user_id, data.userId))
      .limit(1)
    if (existing.length === 0) {
      await db.insert(merchantProfiles).values({
        user_id: data.userId,
        business_name: data.businessName,
      })
    }
    return { success: true }
  })

// ============================================================
// REJECT JOIN REQUEST
// ============================================================

export const rejectJoinRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
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
// UPDATE MERCHANT STATUS
// ============================================================

export const updateMerchantStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        merchantId: z.string().uuid(),
        status: z.enum(['active', 'suspended']),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const [profile] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, data.merchantId))
      .limit(1)
    if (!profile) throw new Error('Merchant not found')
    await db
      .update(users)
      .set({ status: data.status })
      .where(eq(users.id, profile.userId))
    return { success: true }
  })

// ============================================================
// SEND MERCHANT WARNING
// ============================================================

export const sendMerchantWarning = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        merchantId: z.string().uuid(),
        message: z.string().trim().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    if (!data.message.trim()) throw new Error('Warning message is required')
    const [profile] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, data.merchantId))
      .limit(1)
    if (!profile) throw new Error('Merchant not found')
    const [warning] = await db
      .insert(verifications)
      .values({
        id: crypto.randomUUID(), // ✅ الإصلاح
        identifier: `warning:${profile.userId}`,
        value: data.message.trim(),
        expiresAt: new Date('9999-12-31'),
      })
      .returning({
        id: verifications.id,
        createdAt: verifications.createdAt,
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
// DELETE MERCHANT
// ============================================================

export const deleteMerchant = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z.object({ merchantId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const [profile] = await db
      .select({ userId: merchantProfiles.user_id })
      .from(merchantProfiles)
      .where(eq(merchantProfiles.id, data.merchantId))
      .limit(1)
    if (!profile) throw new Error('Merchant not found')
    const now = new Date()
    await Promise.all([
      db
        .update(users)
        .set({ deleted_at: now })
        .where(eq(users.id, profile.userId)),
      db
        .update(merchantProfiles)
        .set({ deleted_at: now })
        .where(eq(merchantProfiles.id, data.merchantId)),
    ])
    return { success: true }
  })

// ============================================================
// INVITE MERCHANT
// ============================================================

const InviteMerchantSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(9, 'رقم الهاتف غير صحيح'),
  businessName: z.string().min(1, 'اسم النشاط التجاري مطلوب'),
})

export type InviteMerchantInput = z.infer<typeof InviteMerchantSchema>

export const inviteMerchant = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => InviteMerchantSchema.parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()

    const email = data.email.toLowerCase().trim()

    // ── 1. فحص التكرار ───────────────────────────────────────
    const [existing] = await db
      .select({ id: users.id, role: users.role, status: users.status })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing) throw new Error('هذا البريد الإلكتروني مستخدم مسبقاً')

    const userId = crypto.randomUUID()

    await db.insert(users).values({
      id: userId,
      name: data.name,
      email: email,
      phone: data.phone,
      emailVerified: true,
      role: 'merchant',
      status: 'active',
    })

    // ── 3. إنشاء merchant_profile ─────────────────────────────
    await db.insert(merchantProfiles).values({
      user_id: userId,
      business_name: data.businessName,
    })

    // ── 4. Magic Link → /set-password ────────────────────────
    try {
      setInviteType(email, 'merchant')
      await auth.api.signInMagicLink({
        body: { email, callbackURL: '/set-password' },
        headers: new Headers(),
      })
    } catch (err) {
      // rollback: نحذف ما أنشأناه إذا فشل الإيميل
      await Promise.all([
        db.delete(merchantProfiles).where(eq(merchantProfiles.user_id, userId)),
        db.delete(users).where(eq(users.id, userId)),
      ])
      console.error('❌ inviteMerchant — signInMagicLink error:', err)
      throw new Error('فشل إرسال البريد الإلكتروني، حاول مرة أخرى')
    }

    return { success: true, userId, businessName: data.businessName }
  })
