// ============================================================
// src/server/delivery/catalog-sync.ts  — SERVER ONLY
//
// مزامنة كاتالوج التوصيل من ECOTRACK إلى الجداول المحلّية (Phase 3.4):
//   - delivery_pricing  ← get/wilayas + get/fees   (tarif / tarif_stopdesk)
//   - delivery_offices  ← get/communes (كل البلديات مع علم has_stop_desk)
//
// تُستدعى دوريّاً (api/cron/sync-catalog) ويدويّاً (زر الأدمن في صفحة الأسعار).
// نموذج الطلبية يقرأ هذه الجداول فقط ولا يلمس ECOTRACK مباشرةً أبداً (Phase 6).
//
// أمان تجاوز الأدمن: لا تُكتب الأسعار فوق صفٍّ admin_override=true إلا عند
// force=true. الحماية ذرّيّة داخل جملة UPSERT واحدة (لا سباق read-then-write).
// ============================================================

import { db } from '#/server/db'
import { deliveryPricing, deliveryOffices } from '#/server/db/schema'
import { getEcotrackClient } from '#/server/services/ecotrack.service'
import { sql } from 'drizzle-orm'

export interface CatalogSyncResult {
  wilayas: number
  offices: number
  forced: boolean
}

export async function syncDeliveryCatalog(
  opts: { accountId?: string; force?: boolean } = {},
): Promise<CatalogSyncResult> {
  const client = await getEcotrackClient(opts.accountId)
  const [wilayas, fees] = await Promise.all([client.getWilayas(), client.getFees()])

  // خريطة التعرفة حسب wilaya_id (tarif=منزلي، tarif_stopdesk=مكتب؛ fallback للمنزلي)
  const feeByWilaya = new Map<number, { home: number; office: number }>()
  for (const f of fees) {
    const home = Math.round(Number(f.tarif) || 0)
    const office =
      f.tarif_stopdesk != null && String(f.tarif_stopdesk) !== ''
        ? Math.round(Number(f.tarif_stopdesk) || 0)
        : home
    feeByWilaya.set(f.wilaya_id, { home, office })
  }

  const now = new Date()

  // ── الأسعار ──────────────────────────────────────────────
  for (const w of wilayas) {
    const price = feeByWilaya.get(w.wilaya_id) ?? { home: 0, office: 0 }
    await db
      .insert(deliveryPricing)
      .values({
        wilaya_id: w.wilaya_id,
        wilaya_name: w.wilaya_name,
        home_price_dzd: price.home,
        office_price_dzd: price.office,
        admin_override: false,
        last_synced_at: now,
      })
      .onConflictDoUpdate({
        target: deliveryPricing.wilaya_id,
        set: {
          wilaya_name: w.wilaya_name,
          last_synced_at: now,
          // احترام تجاوز الأدمن ذرّيّاً ما لم يُفرَض
          home_price_dzd: opts.force
            ? price.home
            : sql`CASE WHEN ${deliveryPricing.admin_override} THEN ${deliveryPricing.home_price_dzd} ELSE ${price.home} END`,
          office_price_dzd: opts.force
            ? price.office
            : sql`CASE WHEN ${deliveryPricing.admin_override} THEN ${deliveryPricing.office_price_dzd} ELSE ${price.office} END`,
          // عند الفرض: امسح علم التجاوز (عُدنا لتعرفة ECOTRACK)
          ...(opts.force ? { admin_override: false } : {}),
        },
      })
  }

  // ── البلديات/المكاتب ─────────────────────────────────────
  let offices = 0
  for (const w of wilayas) {
    let communes
    try {
      communes = await client.getCommunes(w.wilaya_id)
    } catch (err) {
      console.error(`[catalog-sync] فشل جلب بلديات الولاية ${w.wilaya_id}:`, err)
      continue
    }
    for (const c of communes) {
      await db
        .insert(deliveryOffices)
        .values({
          wilaya_id: w.wilaya_id,
          office_code: `${w.wilaya_id}:${c.nom}`,
          name: c.nom,
          address: c.code_postal ?? null,
          has_stop_desk: c.has_stop_desk === 1,
          last_synced_at: now,
        })
        .onConflictDoUpdate({
          target: [deliveryOffices.wilaya_id, deliveryOffices.office_code],
          set: {
            name: c.nom,
            address: c.code_postal ?? null,
            has_stop_desk: c.has_stop_desk === 1,
            last_synced_at: now,
          },
        })
      offices++
    }
  }

  return { wilayas: wilayas.length, offices, forced: opts.force ?? false }
}
