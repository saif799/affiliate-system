import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import {
  orders,
  affiliateProfiles,
  merchantProfiles,
  withdrawalRequests,
  users,
} from '#/server/db/schema'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'
import { getSession } from '#/lib/session'
import type {
  AnalyticsData,
  DateRange,
  PlatformKpis,
  GmvPoint,
  TopAffiliate,
  TopMerchant,
  WilayaStat,
  DeliveryTiming,
} from '../-analytics.types'

// ── Auth guard ────────────────────────────────────────────────

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') {
    const err = new Error('Unauthorized')
    ;(err as any).statusCode = 401
    throw err
  }
  return session
}

function getRangeWindow(range: DateRange): {
  from: Date
  to: Date
  prevFrom: Date
  prevTo: Date
} {
  const now = new Date()
  const to = now

  let from: Date
  let prevFrom: Date
  let prevTo: Date

  if (range === 'this_week') {
    const dayOfWeek = (now.getDay() + 6) % 7 // 0=Mon … 6=Sun
    from = new Date(now)
    from.setDate(now.getDate() - dayOfWeek)
    from.setHours(0, 0, 0, 0)

    prevFrom = new Date(from)
    prevFrom.setDate(from.getDate() - 7)

    prevTo = new Date(now)
    prevTo.setDate(now.getDate() - 7)
  } else if (range === 'this_month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)

    // آخر يوم صالح في الشهر السابق
    const lastDayOfPrevMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
    ).getDate()
    const safeDay = Math.min(now.getDate(), lastDayOfPrevMonth)
    prevTo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      safeDay,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    )
  } else {
    // this_year
    from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)

    prevFrom = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0)

    // FIX: 29 فبراير في سنة كبيسة → 28 فبراير في السنة السابقة
    const lastDayOfPrevYearMonth = new Date(
      now.getFullYear() - 1,
      now.getMonth() + 1,
      0,
    ).getDate()
    const safeDayYear = Math.min(now.getDate(), lastDayOfPrevYearMonth)
    prevTo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      safeDayYear,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    )
  }

  return { from, to, prevFrom, prevTo }
}

/**
 * FIX #4 — يستقبل قيماً خاماً (غير مقربة) لتجنب:
 * 49.6% و50.4% → كلاهما 50% → تغير = صفر مضلل
 */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * FIX #1 — GMV موحّد: delivered فقط في كل مكان
 * (KPIs + الرسم البياني يستعملان نفس التعريف)
 */
function buildGmvSeriesQuery(from: Date, to: Date, byMonth: boolean) {
  const whereClause = and(
    gte(orders.created_at, from),
    lte(orders.created_at, to),
    eq(orders.status, 'delivered'),
  )

  if (byMonth) {
    return db
      .select({
        date: sql<string>`DATE_TRUNC('month', ${orders.created_at})::date`,
        gmv: sql<number>`COALESCE(SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity}), 0)`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(sql`DATE_TRUNC('month', ${orders.created_at})`)
      .orderBy(sql`DATE_TRUNC('month', ${orders.created_at})`)
  }

  return db
    .select({
      date: sql<string>`DATE_TRUNC('day', ${orders.created_at})::date`,
      gmv: sql<number>`COALESCE(SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity}), 0)`,
    })
    .from(orders)
    .where(whereClause)
    .groupBy(sql`DATE_TRUNC('day', ${orders.created_at})`)
    .orderBy(sql`DATE_TRUNC('day', ${orders.created_at})`)
}

// ── KPIs ──────────────────────────────────────────────────────

async function fetchKpis(
  from: Date,
  to: Date,
  prevFrom: Date,
  prevTo: Date,
): Promise<PlatformKpis> {
  const [curr = { gmv: 0, platform: 0, delivered: 0, returned: 0, total: 0 }] =
    await db
      .select({
        gmv: sql<number>`COALESCE(
          SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity})
          FILTER (WHERE ${orders.status} = 'delivered')
        , 0)`,
        platform: sql<number>`COALESCE(
          SUM(${orders.platform_fee_dzd})
          FILTER (WHERE ${orders.status} = 'delivered')
        , 0)`,
        delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
        returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'returned')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(gte(orders.created_at, from), lte(orders.created_at, to)))

  const [prev = { gmv: 0, platform: 0, total: 0, delivered: 0 }] = await db
    .select({
      gmv: sql<number>`COALESCE(
          SUM(${orders.unit_affiliate_price_dzd} * ${orders.quantity})
          FILTER (WHERE ${orders.status} = 'delivered')
        , 0)`,
      platform: sql<number>`COALESCE(
          SUM(${orders.platform_fee_dzd})
          FILTER (WHERE ${orders.status} = 'delivered')
        , 0)`,
      total: sql<number>`COUNT(*)`,
      delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
    })
    .from(orders)
    .where(
      and(gte(orders.created_at, prevFrom), lte(orders.created_at, prevTo)),
    )

  const [pending = { total: 0 }] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${withdrawalRequests.amount_dzd}), 0)`,
    })
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.status, 'pending'))

  // باقي الكود بدون أي تغيير...
  const gmvCurr = Number(curr.gmv)
  const gmvPrev = Number(prev.gmv)
  const platformCurr = Number(curr.platform)
  const platformPrev = Number(prev.platform)
  const totalCurr = Number(curr.total)
  const totalPrev = Number(prev.total)
  const deliveredCurr = Number(curr.delivered)
  const deliveredPrev = Number(prev.delivered)
  const returnedCurr = Number(curr.returned)

  const takeRateRaw = gmvCurr > 0 ? (platformCurr / gmvCurr) * 100 : 0
  const takeRatePrevRaw = gmvPrev > 0 ? (platformPrev / gmvPrev) * 100 : 0
  const deliveryRateRaw = totalCurr > 0 ? (deliveredCurr / totalCurr) * 100 : 0
  const deliveryRatePrevRaw =
    totalPrev > 0 ? (deliveredPrev / totalPrev) * 100 : 0

  return {
    gmv_dzd: Math.round(gmvCurr),
    gmv_change_pct: pctChange(gmvCurr, gmvPrev),

    take_rate_pct: Math.round(takeRateRaw * 10) / 10,
    take_rate_change_pct: pctChange(takeRateRaw, takeRatePrevRaw),

    delivery_rate_pct: Math.round(deliveryRateRaw * 10) / 10,
    delivery_rate_change_pct: pctChange(deliveryRateRaw, deliveryRatePrevRaw),

    orders_total: totalCurr,
    orders_change_pct: pctChange(totalCurr, totalPrev),
    orders_delivered: deliveredCurr,
    orders_returned: returnedCurr,

    pending_withdrawals_dzd: Number(pending.total),
  }
}

// ── GMV series ────────────────────────────────────────────────

async function fetchGmvSeries(
  from: Date,
  to: Date,
  range: DateRange,
): Promise<GmvPoint[]> {
  const rows = await buildGmvSeriesQuery(from, to, range === 'this_year')
  return rows.map((r) => ({ date: r.date, gmv_dzd: Number(r.gmv) }))
}

// ── Top affiliates ────────────────────────────────────────────

async function fetchTopAffiliates(
  from: Date,
  to: Date,
): Promise<TopAffiliate[]> {
  const rows = await db
    .select({
      affiliate_id: affiliateProfiles.id,
      name: users.name,
      wilaya: users.wilaya,
      // إيراد = (سعر البيع - سعر التاجر) × الكمية - رسوم المنصة (per-order)
      // محسوب على delivered فقط
      revenue_dzd: sql<number>`COALESCE(
        SUM(
          (${orders.unit_affiliate_price_dzd} - ${orders.unit_merchant_price_dzd})
          * ${orders.quantity}
          - ${orders.platform_fee_affiliate_dzd}
          - ${orders.shipping_fee_dzd}
        ) FILTER (WHERE ${orders.status} = 'delivered')
      , 0)`,
      // orders_delivered للاتساق مع الإيراد + orders_total للسياق
      orders_delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'delivered')`,
      orders_total: sql<number>`COUNT(*)`,
      refusal_rate_pct: sql<number>`
        ROUND(
          COUNT(*) FILTER (WHERE ${orders.status} = 'returned')::numeric
          / NULLIF(COUNT(*) FILTER (WHERE ${orders.status} IN ('delivered', 'returned')), 0) * 100
        , 1)
      `,
    })
    .from(orders)
    .innerJoin(affiliateProfiles, eq(orders.affiliate_id, affiliateProfiles.id))
    .innerJoin(users, eq(affiliateProfiles.user_id, users.id))
    .where(and(gte(orders.created_at, from), lte(orders.created_at, to)))
    .groupBy(affiliateProfiles.id, users.name, users.wilaya)
    .orderBy(
      desc(
        sql`SUM(
          (${orders.unit_affiliate_price_dzd} - ${orders.unit_merchant_price_dzd})
          * ${orders.quantity}
          - ${orders.platform_fee_affiliate_dzd}
          - ${orders.shipping_fee_dzd}
        ) FILTER (WHERE ${orders.status} = 'delivered')`,
      ),
    )
    .limit(5)

  return rows.map((r) => ({
    affiliate_id: r.affiliate_id,
    name: r.name,
    wilaya: r.wilaya ?? '—',
    revenue_dzd: Number(r.revenue_dzd),
    orders_delivered: Number(r.orders_delivered),
    orders_total: Number(r.orders_total),
    refusal_rate_pct: Number(r.refusal_rate_pct ?? 0),
  }))
}

// ── Top merchants ─────────────────────────────────────────────

async function fetchTopMerchants(from: Date, to: Date): Promise<TopMerchant[]> {
  const rows = await db
    .select({
      merchant_id: merchantProfiles.id,
      business_name: merchantProfiles.business_name,
      orders_total: sql<number>`COUNT(*)`,
      // صافي أرباح التاجر = (سعره × الكمية − رسوم المنصة من التاجر) على delivered فقط
      revenue_dzd: sql<number>`COALESCE(
        SUM(GREATEST(${orders.unit_merchant_price_dzd} * ${orders.quantity} - ${orders.platform_fee_merchant_dzd}, 0))
        FILTER (WHERE ${orders.status} = 'delivered')
      , 0)`,
      return_rate_pct: sql<number>`
        ROUND(
          COUNT(*) FILTER (WHERE ${orders.status} = 'returned')::numeric
          / NULLIF(COUNT(*), 0) * 100
        , 1)
      `,
    })
    .from(orders)
    .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
    .where(and(gte(orders.created_at, from), lte(orders.created_at, to)))
    .groupBy(merchantProfiles.id, merchantProfiles.business_name)
    .orderBy(
      desc(
        sql`SUM(GREATEST(${orders.unit_merchant_price_dzd} * ${orders.quantity} - ${orders.platform_fee_merchant_dzd}, 0))
            FILTER (WHERE ${orders.status} = 'delivered')`,
      ),
    )
    .limit(5)

  return rows.map((r) => ({
    merchant_id: r.merchant_id,
    business_name: r.business_name,
    revenue_dzd: Number(r.revenue_dzd),
    orders_total: Number(r.orders_total),
    return_rate_pct: Number(r.return_rate_pct ?? 0),
  }))
}

// ── Wilaya stats ──────────────────────────────────────────────

async function fetchWilayaStats(from: Date, to: Date): Promise<WilayaStat[]> {
  const rows = await db
    .select({
      wilaya: sql<string>`COALESCE(${orders.customer_wilaya}, 'غير محدد')`,
      orders_count: sql<number>`COUNT(*)`,
      return_rate_pct: sql<number>`
        ROUND(
          COUNT(*) FILTER (WHERE ${orders.status} = 'returned')::numeric
          / NULLIF(COUNT(*), 0) * 100
        , 1)
      `,
    })
    .from(orders)
    .where(and(gte(orders.created_at, from), lte(orders.created_at, to)))
    .groupBy(sql`COALESCE(${orders.customer_wilaya}, 'غير محدد')`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10)

  return rows.map((r) => ({
    wilaya: r.wilaya,
    orders_count: Number(r.orders_count),
    return_rate_pct: Number(r.return_rate_pct ?? 0),
  }))
}

// ── Delivery timing ───────────────────────────────────────────

async function fetchDeliveryTiming(
  from: Date,
  to: Date,
): Promise<DeliveryTiming> {
  // AVG في PostgreSQL يتجاهل الصفوف التي تحتوي NULL في أي طرف من الطرح.
  // لذا sample_size لكل مرحلة = عدد الصفوف التي دخلت AVG فعلاً،
  // وليس COUNT(*) الكلي الذي قد يكون أكبر بكثير ويضلل.
  const [row] = await db
    .select({
      confirm_hours: sql<number>`
        ROUND(AVG(
          EXTRACT(EPOCH FROM (${orders.confirmed_at} - ${orders.created_at}))
        ) / 3600.0, 1)
      `,
      // عدد الصفوف التي دخلت AVG لهذه المرحلة فعلاً
      sample_confirm: sql<number>`
        COUNT(*) FILTER (WHERE ${orders.confirmed_at} IS NOT NULL)
      `,

      ship_hours: sql<number>`
        ROUND(AVG(
          EXTRACT(EPOCH FROM (${orders.shipped_at} - ${orders.confirmed_at}))
        ) / 3600.0, 1)
      `,
      sample_ship: sql<number>`
        COUNT(*) FILTER (WHERE ${orders.shipped_at} IS NOT NULL AND ${orders.confirmed_at} IS NOT NULL)
      `,

      wilaya_hours: sql<number>`
        ROUND(AVG(
          EXTRACT(EPOCH FROM (${orders.at_wilaya_at} - ${orders.shipped_at}))
        ) / 3600.0, 1)
      `,
      sample_wilaya: sql<number>`
        COUNT(*) FILTER (WHERE ${orders.at_wilaya_at} IS NOT NULL AND ${orders.shipped_at} IS NOT NULL)
      `,

      deliver_hours: sql<number>`
        ROUND(AVG(
          EXTRACT(EPOCH FROM (${orders.delivered_at} - ${orders.at_wilaya_at}))
        ) / 3600.0, 1)
      `,
      sample_deliver: sql<number>`
        COUNT(*) FILTER (WHERE ${orders.delivered_at} IS NOT NULL AND ${orders.at_wilaya_at} IS NOT NULL)
      `,

      // avg_total_days مباشرة من DB — أدق إحصائياً من مجموع averages منفصلة
      total_hours: sql<number>`
        ROUND(AVG(
          EXTRACT(EPOCH FROM (${orders.delivered_at} - ${orders.created_at}))
        ) / 3600.0, 1)
      `,
      // sample_size الإجمالي = COUNT(*) صحيح هنا لأن WHERE يشترط delivered
      sample_size: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.created_at, from),
        lte(orders.created_at, to),
        eq(orders.status, 'delivered'),
      ),
    )

  return {
    avg_confirm_hours: Number(row?.confirm_hours ?? 0),
    avg_ship_hours: Number(row?.ship_hours ?? 0),
    avg_wilaya_hours: Number(row?.wilaya_hours ?? 0),
    avg_deliver_hours: Number(row?.deliver_hours ?? 0),
    avg_total_days: Math.round((Number(row?.total_hours ?? 0) / 24) * 10) / 10,
    sample_size: Number(row?.sample_size ?? 0),
    sample_confirm: Number(row?.sample_confirm ?? 0),
    sample_ship: Number(row?.sample_ship ?? 0),
    sample_wilaya: Number(row?.sample_wilaya ?? 0),
    sample_deliver: Number(row?.sample_deliver ?? 0),
  }
}

// ── Main server fn ────────────────────────────────────────────

const AnalyticsInput = z.object({
  range: z.enum(['this_week', 'this_month', 'this_year']).default('this_week'),
})

export const getAnalytics = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => AnalyticsInput.parse(input))
  .handler(async ({ data }): Promise<AnalyticsData> => {
    await requireSuperAdmin()

    const { range } = data
    const { from, to, prevFrom, prevTo } = getRangeWindow(range)

    try {
      const [
        kpis,
        gmv_series,
        top_affiliates,
        top_merchants,
        wilaya_stats,
        delivery_timing,
      ] = await Promise.all([
        fetchKpis(from, to, prevFrom, prevTo),
        fetchGmvSeries(from, to, range),
        fetchTopAffiliates(from, to),
        fetchTopMerchants(from, to),
        fetchWilayaStats(from, to),
        fetchDeliveryTiming(from, to),
      ])

      return {
        range,
        kpis,
        gmv_series,
        top_affiliates,
        top_merchants,
        wilaya_stats,
        delivery_timing,
      }
    } catch (err) {
      console.error('[getAnalytics] DB error:', err)
      throw new Error('Failed to load analytics data')
    }
  })
