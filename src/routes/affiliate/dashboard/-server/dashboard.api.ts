// affiliate/dashboard/-server/dashboard.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { requireAffiliate } from '#/server/auth/guards'
import {
  orders,
  products,
  merchantProfiles,
  wallets,
} from '#/server/db/schema'
import { and, eq, sql, desc, notInArray } from 'drizzle-orm'
import type {
  AffiliateDashboardData,
  TopMerchant,
  RecentOrder,
  OrderStatus,
} from '../-dashboard.types'

// ============================================================
// HELPERS
// ============================================================

const n = (v: unknown) => Number(v ?? 0)
const round1 = (v: number) => Math.round(v * 10) / 10

// عمولة المسوّق لكل طلبية = (سعر بيعه − سعر الجملة) × الكمية − رسوم المنصة − سعر التوصيل
const commissionExpr = sql<number>`GREATEST((${orders.unit_affiliate_price_dzd} - ${orders.unit_merchant_price_dzd}) * ${orders.quantity} - ${orders.platform_fee_affiliate_dzd} - ${orders.shipping_fee_dzd}, 0)`

const RECENT_STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'processing',
  confirmed: 'confirmed',
  shipped: 'shipped',
  at_wilaya: 'shipped',
  delivered: 'delivered',
  returned: 'returned',
}

function relativeTimeAr(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'الآن'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  return `منذ ${days} يوم`
}

// ============================================================
// GET DASHBOARD
// ============================================================

export const getAffiliateDashboard = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AffiliateDashboardData> => {
    const { session, profileId } = await requireAffiliate()

    const scoped = eq(orders.affiliate_id, profileId)

    // ── stats ────────────────────────────────────────────────
    const [statsRow] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(${commissionExpr}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        nonPending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} != 'pending')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(scoped)

    const [wallet] = await db
      .select({ available: wallets.available_balance_dzd })
      .from(wallets)
      .where(eq(wallets.user_id, session.user.id))
      .limit(1)

    const delivered = n(statsRow.delivered)
    const returned = n(statsRow.returned)
    const nonPending = n(statsRow.nonPending)
    const total = n(statsRow.total)

    const stats = {
      totalEarnings: n(statsRow.totalEarnings),
      availableBalance: n(wallet?.available),
      deliveredRate:
        nonPending > 0 ? round1((delivered / nonPending) * 100) : 0,
      retourRate: total > 0 ? round1((returned / total) * 100) : 0,
    }

    // ── topMerchants ─────────────────────────────────────────
    const merchantRows = await db
      .select({
        merchantId: orders.merchant_id,
        name: merchantProfiles.business_name,
        category: sql<string>`COALESCE(mode() WITHIN GROUP (ORDER BY ${products.category}), '')`,
        totalOrders: sql<number>`COUNT(*)`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        nonPending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} != 'pending')`,
        earnings: sql<number>`COALESCE(SUM(${commissionExpr}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
      })
      .from(orders)
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(scoped)
      .groupBy(orders.merchant_id, merchantProfiles.business_name)
      .orderBy(
        desc(
          sql`COALESCE(SUM(${commissionExpr}) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
        ),
      )
      .limit(5)

    const topMerchants: TopMerchant[] = merchantRows.map((r) => {
      const mDelivered = n(r.delivered)
      const mReturned = n(r.returned)
      const mNonPending = n(r.nonPending)
      const mTotal = n(r.totalOrders)
      return {
        id: r.merchantId,
        name: r.name,
        category: r.category || 'تاجر',
        deliveredRate:
          mNonPending > 0 ? round1((mDelivered / mNonPending) * 100) : 0,
        retourRate: mTotal > 0 ? round1((mReturned / mTotal) * 100) : 0,
        totalOrders: mTotal,
        earnings: n(r.earnings),
      }
    })

    // ── recentOrders (آخر 5) ─────────────────────────────────
    const recentRows = await db
      .select({
        id: orders.id,
        productName: products.name,
        merchantName: merchantProfiles.business_name,
        status: orders.status,
        affiliatePrice: orders.unit_affiliate_price_dzd,
        merchantPrice: orders.unit_merchant_price_dzd,
        platformFee: orders.platform_fee_affiliate_dzd,
        shipping: orders.shipping_fee_dzd,
        quantity: orders.quantity,
        createdAt: orders.created_at,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .where(and(scoped, notInArray(orders.status, ['cancelled', 'disputed'])))
      .orderBy(desc(orders.created_at))
      .limit(5)

    const recentOrders: RecentOrder[] = recentRows.map((r) => ({
      id: r.id,
      orderId: `ORD-${r.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      productName: r.productName,
      merchantName: r.merchantName,
      status: RECENT_STATUS_MAP[r.status] ?? 'processing',
      commission: Math.max(
        0,
        (r.affiliatePrice - r.merchantPrice) * r.quantity -
          r.platformFee -
          r.shipping,
      ),
      updatedAt: relativeTimeAr(r.createdAt),
    }))

    return { stats, topMerchants, recentOrders }
  },
)
