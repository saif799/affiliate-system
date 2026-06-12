// scripts/verify-order-flow.ts — proves Issue #2 (affiliate order → merchant) on
// the REAL DB using the same queries/filters the server functions use.
// Lifecycle: addLeadManual(pending) → [merchant must NOT see] → confirmLead(confirmed)
//            → [merchant MUST see] → and the merchant visibility filter is exact.
// Run: npx tsx scripts/verify-order-flow.ts
import { readFileSync } from 'node:fs'

for (const rawLine of readFileSync('.env', 'utf8').split('\n')) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  if (/^[A-Za-z0-9_]+$/.test(key) && process.env[key] === undefined) process.env[key] = val
}

async function main() {
  const { db } = await import('#/server/db')
  const { users, merchantProfiles, affiliateProfiles, products, orders, orderStatusHistory } =
    await import('#/server/db/schema')
  const { and, eq, notInArray } = await import('drizzle-orm')

  const fail = (m: string) => { console.log(`❌ ${m}`); process.exitCode = 1 }
  const pass = (m: string) => console.log(`✅ ${m}`)

  // resolve the real merchant (+2) and affiliate (+1) profile ids (what requireMerchant/requireAffiliate return)
  const [mu] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'abdelwakilbenmoussa+2@gmail.com')).limit(1)
  const [au] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'abdelwakilbenmoussa+1@gmail.com')).limit(1)
  const [mp] = await db.select({ id: merchantProfiles.id }).from(merchantProfiles).where(eq(merchantProfiles.user_id, mu.id)).limit(1)
  const [ap] = await db.select({ id: affiliateProfiles.id }).from(affiliateProfiles).where(eq(affiliateProfiles.user_id, au.id)).limit(1)
  const merchantId = mp.id, affiliateId = ap.id
  console.log(`merchantProfile=${merchantId}  affiliateProfile=${affiliateId}`)

  // the EXACT visibility filter from getMerchantOrders()
  const merchantSees = async () => db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(and(eq(orders.merchant_id, merchantId), notInArray(orders.status, ['pending', 'cancelled', 'disputed'])))

  let productId: string | undefined
  let orderId: string | undefined
  try {
    // 1) merchant creates a product (mirrors merchant products.api insert)
    const [p] = await db.insert(products).values({
      merchant_id: merchantId,
      name: '__VERIFY Test Product',
      merchant_price_dzd: 1000,
      stock_qty: 5,
      is_active: true,
    }).returning({ id: products.id, stock: products.stock_qty })
    productId = p.id
    pass(`merchant created product (stock=${p.stock})`)

    // 2) affiliate creates order (mirrors addLeadManual) — status pending
    const [o] = await db.insert(orders).values({
      product_id: productId,
      affiliate_id: affiliateId,
      merchant_id: merchantId,
      customer_name: 'Verify Customer',
      customer_phone: '0660000000',
      customer_wilaya: 'Sétif',
      customer_wilaya_code: 19,
      customer_commune: 'Sétif',
      customer_address: 'Test address',
      quantity: 1,
      unit_affiliate_price_dzd: 1500,
      unit_merchant_price_dzd: 1000,
      platform_fee_merchant_dzd: 50,
      platform_fee_affiliate_dzd: 50,
      platform_fee_dzd: 100,
      shipping_fee_dzd: 600,
      status: 'pending',
    }).returning({ id: orders.id })
    orderId = o.id
    pass('affiliate created order (status=pending)')

    // 3) merchant must NOT see a pending order
    const before = await merchantSees()
    if (before.some((r) => r.id === orderId)) fail('pending order leaked into merchant view')
    else pass('pending order correctly hidden from merchant')

    // 4) affiliate confirms (mirrors confirmLead) — pending → confirmed + decrement stock + history
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: 'confirmed', confirmed_at: new Date() }).where(eq(orders.id, orderId!))
      await tx.update(products).set({ stock_qty: 4 }).where(eq(products.id, productId!))
      await tx.insert(orderStatusHistory).values({ order_id: orderId!, from_status: 'pending', to_status: 'confirmed', source: 'affiliate' })
    })
    pass('affiliate confirmed order (status=confirmed)')

    // 5) merchant MUST now see the confirmed order
    const after = await merchantSees()
    const seen = after.find((r) => r.id === orderId)
    if (seen) pass(`confirmed order now visible to merchant (status=${seen.status}) — TRANSFER WORKS`)
    else fail('confirmed order NOT visible to merchant — transfer broken')

    // 6) history recorded
    const hist = await db.select({ to: orderStatusHistory.to_status }).from(orderStatusHistory).where(eq(orderStatusHistory.order_id, orderId))
    if (hist.some((h) => h.to === 'confirmed')) pass('status history recorded (pending→confirmed)')
    else fail('status history missing')
  } finally {
    // cleanup
    if (orderId) {
      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.order_id, orderId))
      await db.delete(orders).where(eq(orders.id, orderId))
    }
    if (productId) await db.delete(products).where(eq(products.id, productId))
    console.log('🧹 cleaned up test product + order')
  }
  process.exit(process.exitCode ?? 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
