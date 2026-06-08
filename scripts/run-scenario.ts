// scripts/run-scenario.ts — full end-to-end test scenario against REAL systems.
//   3 products (merchant +2) → 20 orders (affiliate +1) → confirm 15 →
//   merchant ships 15 as REAL DHD shipments → verify tracking at DHD →
//   internal QR + official PDF label → admin scan/verify → sync real status.
//
// Mirrors the exact server-function operations and calls the REAL shared
// services (EcotrackService, label tokens, syncOrderTracking). No mocks.
// Idempotent guard: refuses to re-run if scenario products already exist
// (so it never creates duplicate real shipments).
//
// Run: npx tsx scripts/run-scenario.ts
import { readFileSync, writeFileSync } from 'node:fs'

for (const rawLine of readFileSync('.env', 'utf8').split('\n')) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  if (/^[A-Za-z0-9_]+$/.test(key) && process.env[key] === undefined) process.env[key] = val
}

const SKU_PREFIX = 'SCEN-' // scenario marker
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const { db } = await import('#/server/db')
  const {
    users, merchantProfiles, affiliateProfiles, products, orders,
    orderStatusHistory, deliveryPricing, deliveryOffices, deliveryAccounts,
  } = await import('#/server/db/schema')
  const { and, eq, inArray } = await import('drizzle-orm')
  const { getEcotrackClient } = await import('#/server/services/ecotrack.service')
  const { generateInternalShipmentId, issueLabelToken, verifyLabelToken } =
    await import('#/server/delivery/label')
  const { syncOrderTracking } = await import('#/server/delivery/ecotrack-sync')
  const QRCode = (await import('qrcode')).default

  const log = (m: string) => console.log(m)
  const section = (m: string) => console.log(`\n━━━ ${m} ━━━`)

  // ── resolve actors ────────────────────────────────────────
  const [mu] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'abdelwakilbenmoussa+2@gmail.com')).limit(1)
  const [au] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'abdelwakilbenmoussa+1@gmail.com')).limit(1)
  const [mp] = await db.select({ id: merchantProfiles.id }).from(merchantProfiles).where(eq(merchantProfiles.user_id, mu.id)).limit(1)
  const [ap] = await db.select({ id: affiliateProfiles.id }).from(affiliateProfiles).where(eq(affiliateProfiles.user_id, au.id)).limit(1)
  const merchantId = mp.id, affiliateId = ap.id
  const [acct] = await db.select({ id: deliveryAccounts.id }).from(deliveryAccounts)
    .where(and(eq(deliveryAccounts.provider, 'ecotrack'), eq(deliveryAccounts.is_default, true), eq(deliveryAccounts.is_active, true))).limit(1)
  const accountId = acct?.id
  log(`merchant=${merchantId}  affiliate=${affiliateId}  deliveryAccount=${accountId ?? '(env API_DHD)'}`)

  // ── idempotency guard ─────────────────────────────────────
  const existing = await db.select({ id: products.id }).from(products)
    .where(and(eq(products.merchant_id, merchantId), inArray(products.sku, [`${SKU_PREFIX}1`, `${SKU_PREFIX}2`, `${SKU_PREFIX}3`])))
  if (existing.length > 0) {
    log('\n⚠️  Scenario products already exist — refusing to re-run (would create duplicate REAL DHD shipments).')
    log('   Inspect current state with: node scripts/diag.mjs')
    process.exit(0)
  }

  const client = await getEcotrackClient(accountId)

  // ── pick REAL deliverable wilaya/commune combos from synced catalog ──
  const pricing = await db.select({
    code: deliveryPricing.wilaya_id, name: deliveryPricing.wilaya_name,
    home: deliveryPricing.home_price_dzd, office: deliveryPricing.office_price_dzd,
  }).from(deliveryPricing)
  const pmap = new Map(pricing.map((p) => [p.code, p]))

  // a commune per wilaya (prefer stop-desk so office delivery is valid)
  const offices = await db.select({
    id: deliveryOffices.id, wilaya: deliveryOffices.wilaya_id,
    name: deliveryOffices.name, stop: deliveryOffices.has_stop_desk,
  }).from(deliveryOffices)
  const byWilaya = new Map<number, typeof offices>()
  for (const o of offices) {
    if (!pmap.has(o.wilaya)) continue
    const list = byWilaya.get(o.wilaya) ?? []
    list.push(o); byWilaya.set(o.wilaya, list)
  }
  // build a rotation of wilayas that have at least one stop-desk commune
  const wilayaPool = [...byWilaya.entries()]
    .filter(([, list]) => list.some((o) => o.stop))
    .slice(0, 12)
    .map(([code, list]) => ({ code, office: list.find((o) => o.stop)!, home: list[0] }))
  log(`deliverable wilayas in pool: ${wilayaPool.map((w) => `${w.code}:${pmap.get(w.code)!.name}`).join(', ')}`)

  // ── 1) 3 REAL products (merchant) ─────────────────────────
  section('1) Merchant creates 3 products')
  const PRODUCTS = [
    { name: 'سماعات بلوتوث TWS Pro', price: 2500, stock: 50, sku: `${SKU_PREFIX}1` },
    { name: 'ساعة ذكية Smart Watch X8', price: 3200, stock: 40, sku: `${SKU_PREFIX}2` },
    { name: 'عطر رجالي فاخر 100ml', price: 1800, stock: 60, sku: `${SKU_PREFIX}3` },
  ]
  const productIds: string[] = []
  for (const p of PRODUCTS) {
    const [row] = await db.insert(products).values({
      merchant_id: merchantId, name: p.name, merchant_price_dzd: p.price,
      stock_qty: p.stock, sku: p.sku, category: 'إلكترونيات', is_active: true,
    }).returning({ id: products.id })
    productIds.push(row.id)
    log(`  ✓ ${p.name} — ${p.price} DZD, stock ${p.stock}`)
  }

  // ── 2) 20 orders (affiliate, mirrors addLeadManual) ───────
  section('2) Affiliate creates 20 orders')
  const NAMES = ['محمد أمين', 'سارة بن علي', 'يوسف حمداوي', 'أمينة خليل', 'رضا بوزيد', 'نور الهدى', 'كريم عيسى', 'هبة مرزوقي', 'بلال صحراوي', 'ريان عمراني']
  const PLATFORM_FEE = 50
  const orderIds: string[] = []
  for (let i = 0; i < 20; i++) {
    const pid = productIds[i % 3]
    const price = PRODUCTS[i % 3].price
    const salePrice = price + 1000 // affiliate margin
    const w = wilayaPool[i % wilayaPool.length]
    const pr = pmap.get(w.code)!
    const isOffice = i % 4 === 0
    const office = isOffice ? w.office : w.home
    const [row] = await db.insert(orders).values({
      product_id: pid, affiliate_id: affiliateId, merchant_id: merchantId,
      customer_name: NAMES[i % NAMES.length],
      customer_phone: `06${String(60000000 + i).padStart(8, '0')}`,
      customer_wilaya: pr.name, customer_wilaya_code: w.code,
      customer_commune: office.name, customer_address: `حي النصر، شارع ${i + 1}، ${office.name}`,
      customer_note: i % 5 === 0 ? 'الاتصال قبل التوصيل' : null,
      quantity: 1, unit_affiliate_price_dzd: salePrice, unit_merchant_price_dzd: price,
      platform_fee_merchant_dzd: PLATFORM_FEE, platform_fee_affiliate_dzd: PLATFORM_FEE,
      platform_fee_dzd: PLATFORM_FEE * 2,
      shipping_fee_dzd: isOffice ? pr.office : pr.home,
      delivery_type: isOffice ? 'office' : 'home',
      delivery_office_id: isOffice ? office.id : null,
      status: 'pending',
    }).returning({ id: orders.id })
    orderIds.push(row.id)
  }
  log(`  ✓ 20 orders created (status=pending), across ${wilayaPool.length} wilayas`)

  // ── 3) Confirm 15 (affiliate, mirrors confirmLead) ────────
  section('3) Affiliate confirms 15 orders (5 left pending)')
  const toConfirm = orderIds.slice(0, 15)
  for (const oid of toConfirm) {
    await db.transaction(async (tx) => {
      const [o] = await tx.select({ id: orders.id, status: orders.status, productId: orders.product_id, qty: orders.quantity })
        .from(orders).where(eq(orders.id, oid)).for('update').limit(1)
      if (o.status !== 'pending') return
      const [p] = await tx.select({ stock: products.stock_qty }).from(products).where(eq(products.id, o.productId)).for('update').limit(1)
      if (p.stock < o.qty) throw new Error('insufficient stock')
      await tx.update(products).set({ stock_qty: p.stock - o.qty }).where(eq(products.id, o.productId))
      await tx.update(orders).set({ status: 'confirmed', confirmed_at: new Date() }).where(eq(orders.id, oid))
      await tx.insert(orderStatusHistory).values({ order_id: oid, from_status: 'pending', to_status: 'confirmed', source: 'affiliate' })
    })
  }
  log(`  ✓ 15 confirmed, stock decremented`)

  // ── 4) Merchant ships 15 → REAL DHD shipments (mirrors shipOrder) ──
  section('4) Merchant ships 15 → registering REAL shipments with DHD')
  const shipped: { orderId: string; internalId: string; tracking: string; qrToken: string }[] = []
  const failures: string[] = []
  for (const oid of toConfirm) {
    try {
      // claim (fresh)
      const internalId = generateInternalShipmentId()
      const qrToken = issueLabelToken(internalId, Date.now())
      const [o] = await db.select({
        id: orders.id, name: orders.customer_name, phone: orders.customer_phone,
        addr: orders.customer_address, commune: orders.customer_commune, wcode: orders.customer_wilaya_code,
        wilaya: orders.customer_wilaya, note: orders.customer_note, qty: orders.quantity,
        price: orders.unit_affiliate_price_dzd, dtype: orders.delivery_type, pname: products.name,
      }).from(orders).innerJoin(products, eq(orders.product_id, products.id)).where(eq(orders.id, oid)).limit(1)
      await db.update(orders).set({ internal_shipment_id: internalId, qr_token: qrToken }).where(eq(orders.id, oid))

      // REAL DHD shipment
      const res = await client.createOrder({
        reference: o.id, nom_client: o.name, telephone: o.phone,
        adresse: o.addr?.trim() || `${o.commune}، ${o.wilaya}`,
        commune: o.commune!, code_wilaya: o.wcode!, montant: o.price * o.qty,
        produit: o.pname, remarque: o.note ?? undefined, quantite: o.qty,
        type: 1, stop_desk: o.dtype === 'office' ? 1 : 0,
      })
      const tracking = res.tracking
      if (!tracking) throw new Error('DHD returned no tracking')

      await db.transaction(async (tx) => {
        await tx.update(orders).set({ status: 'shipped', shipped_at: new Date(), tracking_number: tracking, ecotrack_account_id: accountId ?? null, delivery_status: 'pending' }).where(eq(orders.id, oid))
        await tx.insert(orderStatusHistory).values({ order_id: oid, from_status: 'confirmed', to_status: 'shipped', source: 'merchant' })
      })
      shipped.push({ orderId: oid, internalId, tracking, qrToken })
      log(`  ✓ ${internalId} → DHD tracking ${tracking}`)
      await sleep(400) // be polite to the API
    } catch (e: any) {
      // release claim so it can retry (mirrors releaseShipClaim)
      await db.update(orders).set({ internal_shipment_id: null, qr_token: null }).where(eq(orders.id, oid))
      failures.push(`${oid}: ${e?.message}`)
      log(`  ✗ ship failed for ${oid}: ${e?.message}`)
    }
  }
  log(`  → ${shipped.length}/15 shipped to DHD${failures.length ? `, ${failures.length} failed` : ''}`)

  // ── 5) Verify tracking numbers exist at DHD ───────────────
  section('5) Verify tracking numbers at DHD (get/tracking/info)')
  let verified = 0
  for (const s of shipped.slice(0, 5)) { // sample 5 to confirm; all share the same path
    try {
      const info = await client.getTrackingInfo(s.tracking)
      const acts = info.activity ?? []
      verified++
      log(`  ✓ ${s.tracking} exists at DHD — ${acts.length} activity event(s)${acts[0] ? `, latest: ${acts[acts.length - 1]?.status ?? acts[0]?.status}` : ''}`)
      await sleep(300)
    } catch (e: any) {
      log(`  ✗ ${s.tracking}: ${e?.message}`)
    }
  }
  log(`  → ${verified}/${Math.min(5, shipped.length)} sampled trackings confirmed at DHD`)

  // ── 6) Labels: internal QR (all) + official PDF (proof) ────
  section('6) Print labels')
  if (shipped[0]) {
    const qrDataUrl = await QRCode.toDataURL(shipped[0].qrToken, { margin: 1, width: 240 })
    log(`  ✓ internal QR label generated (data URL ${qrDataUrl.length} bytes) for ${shipped[0].internalId}`)
    try {
      const label = await client.getLabel(shipped[0].tracking)
      log(`  ✓ official DHD PDF label fetched for ${shipped[0].tracking} (${label.base64.length} base64 chars)`)
    } catch (e: any) {
      log(`  ✗ official label fetch: ${e?.message}`)
    }
  }

  // ── 7) Admin scan/verify (mirrors verifyShipmentByQr) ─────
  section('7) Admin scans QR → match → verify at provider')
  if (shipped[0]) {
    const v = verifyLabelToken(shipped[0].qrToken, Date.now())
    if (v.ok) {
      const [match] = await db.select({ id: orders.id, internal: orders.internal_shipment_id, tracking: orders.tracking_number, wilaya: orders.customer_wilaya })
        .from(orders).where(eq(orders.internal_shipment_id, v.internalShipmentId)).limit(1)
      log(`  ✓ token valid → matched order ${match.internal} (${match.wilaya}), tracking ${match.tracking}`)
      const info = await client.getTrackingInfo(match.tracking!)
      log(`  ✓ provider confirms shipment exists (${(info.activity ?? []).length} events) → "received by delivery company"`)
    }
  }

  // ── 8) Admin marks received = sync REAL status (no fake status) ──
  section('8) Admin confirms reception → sync REAL DHD status')
  for (const s of shipped.slice(0, 3)) {
    try {
      const r = await syncOrderTracking(s.orderId)
      log(`  ✓ ${s.tracking}: delivery_status=${r.deliveryStatus ?? '∅'} platform_status=${r.status} (events applied: ${r.eventsApplied})`)
      await sleep(300)
    } catch (e: any) {
      log(`  ✗ sync ${s.tracking}: ${e?.message}`)
    }
  }

  // ── persist tracking numbers for the user ─────────────────
  const out = shipped.map((s) => `${s.internalId}\t${s.tracking}\t${s.orderId}`).join('\n')
  writeFileSync('scripts/scenario-trackings.tsv', `internal_shipment_id\ttracking_number\torder_id\n${out}\n`)

  section('SUMMARY')
  const finalCounts = await db.select({ status: orders.status }).from(orders).where(eq(orders.merchant_id, merchantId))
  const tally: Record<string, number> = {}
  for (const r of finalCounts) tally[r.status] = (tally[r.status] ?? 0) + 1
  console.table(tally)
  log(`Real DHD shipments: ${shipped.length} (tracking numbers saved to scripts/scenario-trackings.tsv)`)
  log(failures.length ? `Failures: ${failures.length}` : 'No failures.')
  process.exit(0)
}

main().catch((e) => { console.error('SCENARIO ERROR:', e); process.exit(1) })
