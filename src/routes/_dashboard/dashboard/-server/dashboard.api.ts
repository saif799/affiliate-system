// src/routes/_dashboard/dashboard/-server/dashboard.api.ts
import { createServerFn } from '@tanstack/react-start'
import { db }             from '#/server/db'
import { getSession }     from '#/lib/session'
import {
  users,
  orders,
  transactions,
  affiliateProfiles,
} from '#/server/db/schema'
import { eq, and, gte, lt, sql, desc, isNull } from 'drizzle-orm'
import type {
  DashboardData,
  PlatformStats,
  MonthlyRevenue,
  TopAffiliate,
  WilayaStat,
  ActivityItem,
} from '../-dashboard.types'

// ── مساعد: نطاقات الشهر ──────────────────────────────────
// FIX ③: thisStart كحد أعلى بدل lastEnd لضمان عدم فقدان أي بيانات
function getMonthRanges() {
  const now       = new Date()
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { thisStart, nextStart, lastStart }
}

function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ════════════════════════════════════════════════════════════
// ① البطاقات الـ 6
// ════════════════════════════════════════════════════════════
async function fetchCardsStats(): Promise<PlatformStats> {
  const { thisStart, nextStart, lastStart } = getMonthRanges()

  const [
    merchantsThis, merchantsLast,
    affiliatesThis, affiliatesLast,
    gmvThis,        gmvLast,
    revenueThis,    revenueLast,
    convsThis,      convsLast,
    pendingComm,
  ] = await Promise.all([
    db.select({ c: sql<number>`COUNT(*)` }).from(users)
      .where(and(eq(users.role, 'merchant'), isNull(users.deleted_at), gte(users.createdAt, thisStart), lt(users.createdAt, nextStart))),
    db.select({ c: sql<number>`COUNT(*)` }).from(users)
      .where(and(eq(users.role, 'merchant'), isNull(users.deleted_at), gte(users.createdAt, lastStart), lt(users.createdAt, thisStart))),

    db.select({ c: sql<number>`COUNT(DISTINCT affiliate_id)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, thisStart), lt(orders.created_at, nextStart))),
    db.select({ c: sql<number>`COUNT(DISTINCT affiliate_id)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, lastStart), lt(orders.created_at, thisStart))),

    db.select({ s: sql<number>`COALESCE(SUM(unit_affiliate_price_dzd * quantity), 0)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, thisStart), lt(orders.created_at, nextStart))),
    db.select({ s: sql<number>`COALESCE(SUM(unit_affiliate_price_dzd * quantity), 0)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, lastStart), lt(orders.created_at, thisStart))),

    db.select({ s: sql<number>`COALESCE(SUM(platform_fee_dzd), 0)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, thisStart), lt(orders.created_at, nextStart))),
    db.select({ s: sql<number>`COALESCE(SUM(platform_fee_dzd), 0)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, lastStart), lt(orders.created_at, thisStart))),

    db.select({ c: sql<number>`COUNT(*)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, thisStart), lt(orders.created_at, nextStart))),
    db.select({ c: sql<number>`COUNT(*)` }).from(orders)
      .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, lastStart), lt(orders.created_at, thisStart))),

    db.select({ s: sql<number>`COALESCE(SUM(ABS(amount_dzd)), 0)` }).from(transactions)
      .where(and(eq(transactions.type, 'commission'), eq(transactions.status, 'pending'))),
  ])

  const n = (v: any) => Number(v ?? 0)

  return {
    totalMerchants:     { value: n(merchantsThis[0]?.c),  growth: growthRate(n(merchantsThis[0]?.c),  n(merchantsLast[0]?.c)),  sparkline: [] },
    activeAffiliates:   { value: n(affiliatesThis[0]?.c), growth: growthRate(n(affiliatesThis[0]?.c), n(affiliatesLast[0]?.c)), sparkline: [] },
    totalGMV:           { value: n(gmvThis[0]?.s),        growth: growthRate(n(gmvThis[0]?.s),        n(gmvLast[0]?.s)),        sparkline: [] },
    platformRevenue:    { value: n(revenueThis[0]?.s),    growth: growthRate(n(revenueThis[0]?.s),    n(revenueLast[0]?.s)),    sparkline: [] },
    totalConversions:   { value: n(convsThis[0]?.c),      growth: growthRate(n(convsThis[0]?.c),      n(convsLast[0]?.c)),      sparkline: [] },
    pendingCommissions: { value: n(pendingComm[0]?.s),    growth: 0,                                                             sparkline: [] },
  }
}

// ════════════════════════════════════════════════════════════
// ② المخططات الزمنية — مع السنة لتجنب التداخل بين السنوات
// ════════════════════════════════════════════════════════════
async function fetchRevenueChart(): Promise<MonthlyRevenue[]> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const yearEnd   = new Date(new Date().getFullYear() + 1, 0, 1)

  const rows = await db
    .select({
      month:           sql<string>`TO_CHAR(created_at, 'Mon')`,
      monthNum:        sql<number>`EXTRACT(MONTH FROM created_at)`,
      gmv:             sql<number>`COALESCE(SUM(unit_affiliate_price_dzd * quantity), 0)`,
      platformRevenue: sql<number>`COALESCE(SUM(platform_fee_dzd), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.status, 'delivered'), gte(orders.created_at, yearStart), lt(orders.created_at, yearEnd)))
    .groupBy(sql`TO_CHAR(created_at, 'Mon')`, sql`EXTRACT(MONTH FROM created_at)`)
    .orderBy(sql`EXTRACT(MONTH FROM created_at)`)

  return rows.map((r) => ({
    month:           r.month,
    gmv:             Number(r.gmv),
    platformRevenue: Number(r.platformRevenue),
  }))
}

// ════════════════════════════════════════════════════════════
// ③ أفضل 5 مسوقين
// FIX ①: استبدال alias o بـ ${orders.field} مباشرة
// ════════════════════════════════════════════════════════════
async function fetchTopAffiliates(): Promise<TopAffiliate[]> {
  const rows = await db
    .select({
      id:          users.id,
      name:        users.name,
      wilaya:      users.wilaya,
      conversions: sql<number>`COUNT(${orders.id})`,
      revenue:     sql<number>`COALESCE(SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity}), 0)`,
    })
    .from(users)
    .innerJoin(affiliateProfiles, eq(affiliateProfiles.user_id, users.id))
    .innerJoin(orders, and(eq(orders.affiliate_id, affiliateProfiles.id), eq(orders.status, 'delivered')))
    .where(and(eq(users.role, 'affiliate'), isNull(users.deleted_at)))
    .groupBy(users.id, users.name, users.wilaya)
    .orderBy(desc(sql`SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity})`))
    .limit(5)

  return rows.map((r) => ({
    id:          r.id,
    name:        r.name,
    wilaya:      r.wilaya ?? '—',
    conversions: Number(r.conversions),
    revenue:     Number(r.revenue),
  }))
}

// ════════════════════════════════════════════════════════════
// ④ التوزيع الجغرافي
// ════════════════════════════════════════════════════════════
async function fetchWilayaStats(): Promise<WilayaStat[]> {
  const rows = await db
    .select({
      wilaya:      orders.customer_wilaya,
      conversions: sql<number>`COUNT(*)`,
      revenue:     sql<number>`COALESCE(SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.status, 'delivered')))
    .groupBy(orders.customer_wilaya)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10)

  return rows.map((r) => ({
    wilaya:      r.wilaya || '—',
    conversions: Number(r.conversions),
    revenue:     Number(r.revenue),
  }))
}

// ════════════════════════════════════════════════════════════
// ⑤ آخر النشاطات
// FIX ②: الترتيب بـ createdAt.getTime() بدل نص عربي
// ════════════════════════════════════════════════════════════
async function fetchRecentActivity(): Promise<ActivityItem[]> {
  // تشغيل الاستعلامين بالتوازي
  const [recentOrders, recentUsers] = await Promise.all([
    db
      .select({
        id:        orders.id,
        name:      users.name,
        wilaya:    orders.customer_wilaya,
        amount:    sql<number>`${orders.unit_affiliate_price_dzd} * ${orders.quantity}`,
        createdAt: orders.created_at,
      })
      .from(orders)
      .innerJoin(affiliateProfiles, eq(affiliateProfiles.id, orders.affiliate_id))
      .innerJoin(users, eq(users.id, affiliateProfiles.user_id))
      .where(eq(orders.status, 'delivered'))
      .orderBy(desc(orders.created_at))
      .limit(5),

    db
      .select({
        id:        users.id,
        name:      users.name,
        role:      users.role,
        wilaya:    users.wilaya,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNull(users.deleted_at))
      .orderBy(desc(users.createdAt))
      .limit(5),
  ])

  const activities = [
    ...recentOrders.map((o) => ({
      id:        o.id,
      type:      'conversion' as const,
      actor:     o.name,
      wilaya:    o.wilaya,
      amount:    Number(o.amount),
      createdAt: o.createdAt,           // نحتفظ بـ Date للترتيب
      timestamp: formatTimeAgo(o.createdAt),
    })),
    ...recentUsers.map((u) => ({
      id:        u.id,
      type:      (u.role === 'merchant' ? 'new_merchant' : 'new_affiliate') as ActivityItem['type'],
      actor:     u.name,
      wilaya:    u.wilaya ?? '—',
      createdAt: u.createdAt,           // نحتفظ بـ Date للترتيب
      timestamp: formatTimeAgo(u.createdAt),
    })),
  ]

  return activities
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // ترتيب زمني حقيقي
    .slice(0, 10)
    .map(({ createdAt: _, ...rest }) => rest) // نحذف createdAt من النتيجة النهائية
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)    return `منذ ${diff} ثانية`
  if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} دقيقة`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`
  return `منذ ${Math.floor(diff / 86400)} يوم`
}

// ════════════════════════════════════════════════════════════
// الدالة الرئيسية
// ════════════════════════════════════════════════════════════
export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardData> => {

    const session = await getSession()
    if (!session || session.user.role !== 'super_admin') {
      throw new Error('Unauthorized')
    }

    const [stats, monthlyRevenue, topAffiliates, wilayaStats, recentActivity] =
      await Promise.all([
        fetchCardsStats(),
        fetchRevenueChart(),
        fetchTopAffiliates(),
        fetchWilayaStats(),
        fetchRecentActivity(),
      ])

    return { stats, monthlyRevenue, topAffiliates, wilayaStats, recentActivity }
  },
)