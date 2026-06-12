// merchant/dashboard/-server/dashboard.api.ts

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { requireMerchant } from '#/server/auth/guards'
import { orders, products } from '#/server/db/schema'
import { and, eq, gte, isNull, sql, desc } from 'drizzle-orm'
import type {
  MerchantDashboardData,
  ChartDataPoint,
  RecentOrder,
  DateRange,
} from '../-dashboard.types'

// ============================================================
// HELPERS
// ============================================================

function rangeToDays(range: DateRange): number {
  if (range === 'today') return 1
  if (range === '7days') return 7
  return 30
}

/** Start of the window (inclusive), at 00:00 UTC of the first day. */
function rangeStart(range: DateRange): Date {
  const days = rangeToDays(range)
  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return start
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDDMM(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

const RECENT_STATUS_MAP: Record<string, RecentOrder['status']> = {
  pending: 'pending',
  confirmed: 'pending',
  shipped: 'shipped',
  at_wilaya: 'shipped',
  delivered: 'delivered',
  returned: 'returned',
}

const n = (v: unknown) => Number(v ?? 0)

// ============================================================
// GET DASHBOARD
// ============================================================

export const getMerchantDashboard = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    const range = (data as { range?: DateRange } | undefined)?.range
    return { range: (range ?? '7days') }
  })
  .handler(async ({ data }): Promise<MerchantDashboardData> => {
    const { profileId } = await requireMerchant()
    const { range } = data
    const start = rangeStart(range)
    const startIso = start.toISOString()

    const scoped = and(
      eq(orders.merchant_id, profileId),
      gte(orders.created_at, sql`${startIso}::timestamptz`),
    )

    // ── stats (range-scoped) ─────────────────────────────────
    const [statsRow] = await db
      .select({
        netRevenue: sql<number>`COALESCE(SUM(GREATEST(${orders.unit_merchant_price_dzd} * ${orders.quantity} - ${orders.platform_fee_merchant_dzd}, 0)) FILTER (WHERE ${orders.status} = 'delivered'), 0)`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        nonPending: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} != 'pending')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(scoped)

    // pendingPackaging is current state, not range-scoped
    const [pendingRow] = await db
      .select({
        pendingPackaging: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('pending', 'confirmed'))`,
      })
      .from(orders)
      .where(eq(orders.merchant_id, profileId))

    const delivered = n(statsRow.delivered)
    const returned = n(statsRow.returned)
    const nonPending = n(statsRow.nonPending)
    const total = n(statsRow.total)

    const stats = {
      netRevenue: n(statsRow.netRevenue),
      pendingPackaging: n(pendingRow.pendingPackaging),
      deliveryRate: nonPending > 0 ? Math.round((delivered / nonPending) * 1000) / 10 : 0,
      returnRate: total > 0 ? Math.round((returned / total) * 1000) / 10 : 0,
    }

    // ── chartData (range-scoped, grouped by day) ─────────────
    const chartRows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${orders.created_at}), 'YYYY-MM-DD')`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
      })
      .from(orders)
      .where(scoped)
      .groupBy(sql`date_trunc('day', ${orders.created_at})`)

    const chartByDay = new Map(
      chartRows.map((r) => [r.day, { delivered: n(r.delivered), returned: n(r.returned) }]),
    )

    const days = rangeToDays(range)
    const chartData: ChartDataPoint[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setUTCDate(d.getUTCDate() + i)
      const key = dayKey(d)
      const entry = chartByDay.get(key) ?? { delivered: 0, returned: 0 }
      chartData.push({ date: formatDDMM(d), delivered: entry.delivered, returned: entry.returned })
    }

    // ── recentOrders (last 5) ────────────────────────────────
    const recentRows = await db
      .select({
        id: orders.id,
        wilaya: orders.customer_wilaya,
        productName: products.name,
        status: orders.status,
        createdAt: orders.created_at,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(eq(orders.merchant_id, profileId))
      .orderBy(desc(orders.created_at))
      .limit(5)

    const recentOrders: RecentOrder[] = recentRows.map((r) => ({
      id: r.id,
      wilaya: r.wilaya,
      productName: r.productName,
      status: RECENT_STATUS_MAP[r.status] ?? 'pending',
      createdAt: r.createdAt.toISOString().slice(0, 10),
    }))

    // ── lowStockProducts ─────────────────────────────────────
    const lowStockRows = await db
      .select({
        id: products.id,
        name: products.name,
        stockQuantity: products.stock_qty,
        threshold: products.low_stock_threshold,
      })
      .from(products)
      .where(
        and(
          eq(products.merchant_id, profileId),
          isNull(products.deleted_at),
          sql`${products.stock_qty} <= ${products.low_stock_threshold}`,
        ),
      )
      .orderBy(products.stock_qty)

    const lowStockProducts = lowStockRows.map((r) => ({
      id: r.id,
      name: r.name,
      stockQuantity: r.stockQuantity,
      threshold: r.threshold,
    }))

    // ── topProducts (range-scoped, delivered) ────────────────
    const topRows = await db
      .select({
        id: products.id,
        name: products.name,
        totalSold: sql<number>`COUNT(${orders.id})`,
        revenue: sql<number>`COALESCE(SUM(GREATEST(${orders.unit_merchant_price_dzd} * ${orders.quantity} - ${orders.platform_fee_merchant_dzd}, 0)), 0)`,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .where(and(scoped, eq(orders.status, 'delivered')))
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`COUNT(${orders.id})`))
      .limit(3)

    const topProducts = topRows.map((r) => ({
      id: r.id,
      name: r.name,
      totalSold: n(r.totalSold),
      revenue: n(r.revenue),
    }))

    return { stats, chartData, recentOrders, lowStockProducts, topProducts }
  })
