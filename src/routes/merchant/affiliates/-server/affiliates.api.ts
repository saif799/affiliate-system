// src/routes/merchant/affiliates/-server/affiliates.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  merchantProfiles,
  affiliateProfiles,
  trackingLinks,
  products,
  orders,
  users,
} from '#/server/db/schema'
import { and, eq, isNull, sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import type {
  AffiliatesPageData,
  Affiliate,
  AffiliateTier,
  AffiliateTopProduct,
  AffiliateMonthlySale,
} from '../-affiliates.types'

// ============================================================
// HELPERS
// ============================================================

async function requireMerchant() {
  const session = await getSession()
  if (!session || session.user.role !== 'merchant') throw new Error('Unauthorized')

  const [profile] = await db
    .select({ id: merchantProfiles.id })
    .from(merchantProfiles)
    .where(eq(merchantProfiles.user_id, session.user.id))
    .limit(1)

  if (!profile) throw new Error('Merchant profile not found')
  return { session, profileId: profile.id }
}

const n = (v: unknown) => Number(v ?? 0)

// عمولة الطلب = (سعر المسوّق - سعر التاجر) × الكمية - رسوم المنصة من المسوّق
const commissionExpr = sql<number>`GREATEST((${orders.unit_affiliate_price_dzd} - ${orders.unit_merchant_price_dzd}) * ${orders.quantity} - ${orders.platform_fee_affiliate_dzd}, 0)`

const AVATAR_PALETTE = [
  '#ddd1fe',
  '#d1fae5',
  '#fee2e2',
  '#dbeafe',
  '#fef3c7',
  '#fce7f3',
  '#e0e7ff',
]

function avatarColor(id: string): string {
  return AVATAR_PALETTE[id.charCodeAt(0) % AVATAR_PALETTE.length]
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
}

function tierOf(totalOrders: number): AffiliateTier {
  if (totalOrders < 10) return 'bronze'
  if (totalOrders < 50) return 'silver'
  return 'gold'
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

// ============================================================
// GET AFFILIATES DATA
// ============================================================

export const getAffiliatesData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AffiliatesPageData> => {
    const { profileId } = await requireMerchant()

    const now = new Date()
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString()
    const window30Start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    window30Start.setUTCDate(window30Start.getUTCDate() - 29)

    // ── affiliates with an active tracking link for this merchant ──
    const affRows = await db
      .selectDistinct({
        id: affiliateProfiles.id,
        name: users.name,
        phone: users.phone,
        wilaya: users.wilaya,
        createdAt: users.createdAt,
        approvedAt: users.approved_at,
        userStatus: users.status,
      })
      .from(trackingLinks)
      .innerJoin(affiliateProfiles, eq(trackingLinks.affiliate_id, affiliateProfiles.id))
      .innerJoin(products, eq(trackingLinks.product_id, products.id))
      .innerJoin(users, eq(affiliateProfiles.user_id, users.id))
      .where(
        and(
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
          eq(trackingLinks.is_active, true),
          isNull(affiliateProfiles.deleted_at),
          isNull(users.deleted_at),
        ),
      )

    const affiliateIds = affRows.map((r) => r.id)

    if (affiliateIds.length === 0) {
      const stats = await fetchAffiliateStats(profileId, monthStart, 0)
      return { stats, affiliates: [] }
    }

    // ── per-affiliate order aggregates (scoped to this merchant) ──
    const aggRows = await db
      .select({
        affiliateId: orders.affiliate_id,
        totalOrders: sql<number>`COUNT(*)`,
        deliveredOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returnedOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        totalSales: sql<number>`COALESCE(SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
        totalCommissions: sql<number>`COALESCE(SUM(${commissionExpr}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
      })
      .from(orders)
      .where(
        and(eq(orders.merchant_id, profileId), inArray(orders.affiliate_id, affiliateIds)),
      )
      .groupBy(orders.affiliate_id)

    const aggById = new Map(aggRows.map((r) => [r.affiliateId, r]))

    // ── top products per affiliate (delivered) ──
    const topRows = await db
      .select({
        affiliateId: orders.affiliate_id,
        productId: products.id,
        productName: products.name,
        unitsSold: sql<number>`COALESCE(SUM(${orders.quantity}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
        commission: sql<number>`COALESCE(SUM(${commissionExpr}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(
        and(eq(orders.merchant_id, profileId), inArray(orders.affiliate_id, affiliateIds)),
      )
      .groupBy(orders.affiliate_id, products.id, products.name)

    const topByAffiliate = new Map<string, AffiliateTopProduct[]>()
    for (const r of topRows) {
      if (!r.affiliateId || n(r.unitsSold) === 0) continue
      const list = topByAffiliate.get(r.affiliateId) ?? []
      list.push({
        productId: r.productId,
        productName: r.productName,
        unitsSold: n(r.unitsSold),
        commission: n(r.commission),
      })
      topByAffiliate.set(r.affiliateId, list)
    }

    // ── last 30 days sales per affiliate per day ──
    const dailyRows = await db
      .select({
        affiliateId: orders.affiliate_id,
        day: sql<string>`to_char(date_trunc('day', ${orders.created_at}), 'YYYY-MM-DD')`,
        orders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchant_id, profileId),
          inArray(orders.affiliate_id, affiliateIds),
          sql`${orders.created_at} >= ${window30Start.toISOString()}::timestamptz`,
        ),
      )
      .groupBy(orders.affiliate_id, sql`date_trunc('day', ${orders.created_at})`)

    const dailyByAffiliate = new Map<string, AffiliateMonthlySale[]>()
    const windowStartMs = window30Start.getTime()
    for (const r of dailyRows) {
      if (!r.affiliateId) continue
      const dayMs = new Date(`${r.day}T00:00:00.000Z`).getTime()
      const dayNumber = Math.floor((dayMs - windowStartMs) / 86_400_000) + 1
      if (dayNumber < 1 || dayNumber > 30) continue
      const list = dailyByAffiliate.get(r.affiliateId) ?? []
      list.push({ day: dayNumber, orders: n(r.orders) })
      dailyByAffiliate.set(r.affiliateId, list)
    }

    const affiliates: Affiliate[] = affRows.map((r) => {
      const agg = aggById.get(r.id)
      const totalOrders = n(agg?.totalOrders)
      const deliveredOrders = n(agg?.deliveredOrders)
      const returnedOrders = n(agg?.returnedOrders)
      const top = (topByAffiliate.get(r.id) ?? [])
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 3)
      const daily = (dailyByAffiliate.get(r.id) ?? []).sort((a, b) => a.day - b.day)

      return {
        id: r.id,
        name: r.name,
        initials: initialsOf(r.name),
        avatarColor: avatarColor(r.id),
        phone: r.phone ?? '—',
        wilaya: r.wilaya ?? '—',
        joinedAt: (r.approvedAt ?? r.createdAt).toISOString().slice(0, 10),
        tier: tierOf(totalOrders),
        totalOrders,
        deliveredOrders,
        returnRate: totalOrders > 0 ? round1((returnedOrders / totalOrders) * 100) : 0,
        totalSales: n(agg?.totalSales),
        totalCommissions: n(agg?.totalCommissions),
        status: r.userStatus === 'suspended' ? 'blocked' : 'active',
        topProducts: top,
        last30DaysSales: daily,
      }
    })

    const stats = await fetchAffiliateStats(profileId, monthStart, affiliateIds.length)

    return { stats, affiliates }
  },
)

async function fetchAffiliateStats(
  profileId: string,
  monthStart: string,
  activeAffiliates: number,
) {
  const [row] = await db
    .select({
      ordersThisMonth: sql<number>`COUNT(*) FILTER (WHERE ${orders.affiliate_id} IS NOT NULL AND ${orders.created_at} >= ${monthStart}::timestamptz)`,
      totalCommissions: sql<number>`COALESCE(SUM(${commissionExpr}) FILTER (WHERE ${orders.affiliate_id} IS NOT NULL AND ${orders.status} = 'delivered' AND ${orders.created_at} >= ${monthStart}::timestamptz), 0)`,
      totalAff: sql<number>`COUNT(*) FILTER (WHERE ${orders.affiliate_id} IS NOT NULL)`,
      deliveredAff: sql<number>`COUNT(*) FILTER (WHERE ${orders.affiliate_id} IS NOT NULL AND ${orders.status} = 'delivered')`,
    })
    .from(orders)
    .where(eq(orders.merchant_id, profileId))

  const totalAff = n(row?.totalAff)
  const deliveredAff = n(row?.deliveredAff)

  return {
    activeAffiliates,
    ordersThisMonth: n(row?.ordersThisMonth),
    totalCommissions: n(row?.totalCommissions),
    conversionRate: totalAff > 0 ? round1((deliveredAff / totalAff) * 100) : 0,
  }
}

export const blockAffiliate = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z.object({ affiliateProfileId: z.string() }).parse(input)
  )
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    // confirm that this affiliate has a tracking link for this merchant's products
    const [link] = await db
      .select({ id: trackingLinks.id })
      .from(trackingLinks)
      .innerJoin(products, eq(trackingLinks.product_id, products.id))
      .where(
        and(
          eq(trackingLinks.affiliate_id, data.affiliateProfileId),
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
        )
      )
      .limit(1)

    if (!link) throw new Error('المسوق غير مرتبط بمنتجاتك')

    // resolve the user_id from the affiliate profile
    const [aff] = await db
      .select({ userId: affiliateProfiles.user_id })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, data.affiliateProfileId))
      .limit(1)

    if (!aff) throw new Error('المسوق غير موجود')

    await db
      .update(users)
      .set({ status: 'suspended' })
      .where(eq(users.id, aff.userId))

    return { success: true }
  })

export const unblockAffiliate = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z.object({ affiliateProfileId: z.string() }).parse(input)
  )
  .handler(async ({ data }) => {
    const { profileId } = await requireMerchant()

    const [link] = await db
      .select({ id: trackingLinks.id })
      .from(trackingLinks)
      .innerJoin(products, eq(trackingLinks.product_id, products.id))
      .where(
        and(
          eq(trackingLinks.affiliate_id, data.affiliateProfileId),
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
        )
      )
      .limit(1)

    if (!link) throw new Error('المسوق غير مرتبط بمنتجاتك')

    const [aff] = await db
      .select({ userId: affiliateProfiles.user_id })
      .from(affiliateProfiles)
      .where(eq(affiliateProfiles.id, data.affiliateProfileId))
      .limit(1)

    if (!aff) throw new Error('المسوق غير موجود')

    await db
      .update(users)
      .set({ status: 'active' })
      .where(eq(users.id, aff.userId))

    return { success: true }
  })
