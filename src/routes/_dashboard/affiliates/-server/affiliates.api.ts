// src/routes/_dashboard/affiliates/-server/affiliates.api.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { users, affiliateProfiles, transactions } from '#/server/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import type { AffiliatesData, Affiliate } from '../-affiliates.types'
import { getSession } from '#/lib/session' 

export const getAffiliatesData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AffiliatesData> => {
    const session = await getSession()
    if (!session || session.user.role !== 'super_admin') {
      throw new Error('Unauthorized')
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        wilaya: users.wilaya,
        status: users.status,
        joinedAt: users.createdAt,

        referralCode: affiliateProfiles.referral_code,

        conversions: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM orders o
            JOIN affiliate_profiles ap ON ap.id = o.affiliate_id
            WHERE ap.user_id = ${users.id}
              AND o.status = 'delivered'
          ), 0)
        `.as('conversions'),

        totalSales: sql<number>`
          COALESCE((
            SELECT SUM(o.unit_affiliate_price_dzd * o.quantity)
            FROM orders o
            JOIN affiliate_profiles ap ON ap.id = o.affiliate_id
            WHERE ap.user_id = ${users.id}
              AND o.status = 'delivered'
          ), 0)
        `.as('total_sales'),

        commissionRate: sql<number>`5`.as('commission_rate'),
      })
      .from(users)
      .innerJoin(affiliateProfiles, eq(affiliateProfiles.user_id, users.id))
      .where(and(eq(users.role, 'affiliate'), isNull(users.deleted_at)))
      .orderBy(users.createdAt)

    const affiliates: Affiliate[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      wilaya: row.wilaya ?? '—',
      status: row.status as Affiliate['status'],
      conversions: Number(row.conversions),
      totalSales: Number(row.totalSales),
      commissionRate: Number(row.commissionRate),
      joinedAt: row.joinedAt.toISOString().split('T')[0],
    }))

    const totalAffiliates = affiliates.length
    const activeAffiliates = affiliates.filter(
      (a) => a.status === 'active',
    ).length

    const [commissionRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(ABS(amount_dzd)), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.type, 'commission'))

    const totalCommissionsPaid = Number(commissionRow?.total ?? 0)

    return {
      affiliates,
      totalAffiliates,
      activeAffiliates,
      totalCommissionsPaid,
    }
  },
)
