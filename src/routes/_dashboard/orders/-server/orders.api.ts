// src/routes/_dashboard/orders/-server/orders.api.ts
//
// طلبيات Super Admin — عرض + إدارة النزاعات (flag / resolve).

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import {
  orders,
  products,
  merchantProfiles,
  affiliateProfiles,
  users,
} from '#/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { flagOrderDisputed, resolveDispute } from '#/server/settlement'
import { notify } from '#/server/notify'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin')
    throw new Error('Unauthorized')
  return session
}

export type AdminOrder = {
  id: string
  productName: string
  merchantName: string
  affiliateName: string | null
  customerName: string
  wilaya: string
  total: number
  status: string
  createdAt: string
}

export type AdminOrdersData = { orders: AdminOrder[] }

// قائمة الطلبيات (آخر 200، أحدث أولاً)
export const getAdminOrders = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminOrdersData> => {
    await requireSuperAdmin()

    const affiliateUsers = db
      .select({ id: affiliateProfiles.id, name: users.name })
      .from(affiliateProfiles)
      .innerJoin(users, eq(affiliateProfiles.user_id, users.id))
      .as('affiliate_users')

    const rows = await db
      .select({
        id: orders.id,
        productName: products.name,
        merchantName: merchantProfiles.business_name,
        affiliateName: affiliateUsers.name,
        customerName: orders.customer_name,
        wilaya: orders.customer_wilaya,
        unitAffiliate: orders.unit_affiliate_price_dzd,
        quantity: orders.quantity,
        status: orders.status,
        createdAt: orders.created_at,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .leftJoin(affiliateUsers, eq(orders.affiliate_id, affiliateUsers.id))
      .orderBy(desc(orders.created_at))
      .limit(200)

    return {
      orders: rows.map((r) => ({
        id: r.id,
        productName: r.productName,
        merchantName: r.merchantName,
        affiliateName: r.affiliateName ?? null,
        customerName: r.customerName,
        wilaya: r.wilaya,
        total: r.unitAffiliate * r.quantity,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    }
  },
)

// فتح نزاع على طلبية (تجميدها) + إشعار الطرف/الأطراف المختارة
export const flagOrderDispute = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        note: z.string().max(500).optional(),
        notifyTarget: z.enum(['affiliate', 'merchant', 'both']).default('both'),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()
    await flagOrderDisputed(data.orderId, data.note)

    // مَن نُشعِر؟ (المسوّق / التاجر / كلاهما)
    const [info] = await db
      .select({
        productName: products.name,
        affiliateUserId: affiliateProfiles.user_id,
        merchantUserId: merchantProfiles.user_id,
      })
      .from(orders)
      .innerJoin(products, eq(orders.product_id, products.id))
      .leftJoin(affiliateProfiles, eq(orders.affiliate_id, affiliateProfiles.id))
      .innerJoin(merchantProfiles, eq(orders.merchant_id, merchantProfiles.id))
      .where(eq(orders.id, data.orderId))
      .limit(1)

    if (info) {
      const body = `تم فتح نزاع على طلبية «${info.productName}»${data.note ? ` — ${data.note}` : ''}`
      const jobs: Promise<void>[] = []
      if (
        (data.notifyTarget === 'affiliate' || data.notifyTarget === 'both') &&
        info.affiliateUserId
      ) {
        jobs.push(
          notify({
            userId: info.affiliateUserId,
            type: 'order_status',
            title: 'طلبية قيد النزاع ⚠️',
            body,
            link: '/affiliate/orders',
          }),
        )
      }
      if (data.notifyTarget === 'merchant' || data.notifyTarget === 'both') {
        jobs.push(
          notify({
            userId: info.merchantUserId,
            type: 'order_status',
            title: 'طلبية قيد النزاع ⚠️',
            body,
            link: '/merchant/orders',
          }),
        )
      }
      await Promise.all(jobs)
    }

    return { success: true }
  })

// حلّ النزاع → delivered (تسوية) / returned / cancelled
export const resolveOrderDispute = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        resolution: z.enum(['delivered', 'returned', 'cancelled']),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()
    await resolveDispute(data.orderId, data.resolution, data.note)
    return { success: true }
  })
