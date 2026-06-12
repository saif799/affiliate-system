// ============================================================
// _dashboard/integration/-server/pricing.api.ts  — Super Admin فقط
//
// إدارة تعرفة التوصيل لكل ولاية (Phase 5.4):
//   - getDeliveryPricing : جدول الأسعار المحلّي (المصدر لنموذج الطلبية)
//   - syncDeliveryPricing: مزامنة من ECOTRACK (تحترم admin_override ما لم يُفرَض)
//   - updateDeliveryPrice: تعديل يدويّ ⇒ admin_override=true
//   - resetDeliveryPrice : مسح التجاوز + إعادة جلب تعرفة الولاية من ECOTRACK
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '#/server/db'
import { deliveryPricing } from '#/server/db/schema'
import { asc, eq } from 'drizzle-orm'
import { requireSuperAdmin } from '#/server/auth/guards'
import { syncDeliveryCatalog } from '#/server/delivery/catalog-sync'
import { getEcotrackClient } from '#/server/services/ecotrack.service'

export interface PricingRow {
  wilayaId: number
  wilayaName: string
  homePrice: number
  officePrice: number
  adminOverride: boolean
  lastSyncedAt: string
}

export const getDeliveryPricing = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PricingRow[]> => {
    await requireSuperAdmin()
    const rows = await db
      .select()
      .from(deliveryPricing)
      .orderBy(asc(deliveryPricing.wilaya_id))
    return rows.map((r) => ({
      wilayaId: r.wilaya_id,
      wilayaName: r.wilaya_name,
      homePrice: r.home_price_dzd,
      officePrice: r.office_price_dzd,
      adminOverride: r.admin_override,
      lastSyncedAt: r.last_synced_at.toISOString(),
    }))
  },
)

export const syncDeliveryPricing = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ force: z.boolean().default(false) }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return syncDeliveryCatalog({ force: data.force })
  })

export const updateDeliveryPrice = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        wilayaId: z.number().int().min(1).max(58),
        homePrice: z.number().int().min(0),
        officePrice: z.number().int().min(0),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await requireSuperAdmin()
    const updated = await db
      .update(deliveryPricing)
      .set({
        home_price_dzd: data.homePrice,
        office_price_dzd: data.officePrice,
        admin_override: true,
      })
      .where(eq(deliveryPricing.wilaya_id, data.wilayaId))
      .returning({ id: deliveryPricing.id })
    if (updated.length === 0) {
      throw new Error('الولاية غير موجودة — زامِن الأسعار من ECOTRACK أولاً')
    }
    return { success: true }
  })

export const resetDeliveryPrice = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ wilayaId: z.number().int().min(1).max(58) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean; homePrice: number; officePrice: number }> => {
    await requireSuperAdmin()
    const client = await getEcotrackClient()
    const fees = await client.getFees()
    const fee = fees.find((f) => f.wilaya_id === data.wilayaId)
    if (!fee) throw new Error('لا توجد تعرفة لهذه الولاية لدى ECOTRACK')

    const home = Math.round(Number(fee.tarif) || 0)
    const office =
      fee.tarif_stopdesk != null && String(fee.tarif_stopdesk) !== ''
        ? Math.round(Number(fee.tarif_stopdesk) || 0)
        : home

    const updated = await db
      .update(deliveryPricing)
      .set({
        home_price_dzd: home,
        office_price_dzd: office,
        admin_override: false,
        last_synced_at: new Date(),
      })
      .where(eq(deliveryPricing.wilaya_id, data.wilayaId))
      .returning({ id: deliveryPricing.id })
    if (updated.length === 0) throw new Error('الولاية غير موجودة')

    return { success: true, homePrice: home, officePrice: office }
  })
