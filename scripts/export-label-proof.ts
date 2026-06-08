// scripts/export-label-proof.ts — export tangible proof artifacts for ONE real
// scenario shipment: the official DHD PDF label + the internal QR PNG.
// Run: npx tsx scripts/export-label-proof.ts
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

async function main() {
  const { db } = await import('#/server/db')
  const { orders } = await import('#/server/db/schema')
  const { and, eq, isNotNull } = await import('drizzle-orm')
  const { getEcotrackClient } = await import('#/server/services/ecotrack.service')
  const QRCode = (await import('qrcode')).default

  const [o] = await db
    .select({ internal: orders.internal_shipment_id, tracking: orders.tracking_number, qr: orders.qr_token })
    .from(orders)
    .where(and(eq(orders.status, 'shipped'), isNotNull(orders.tracking_number), isNotNull(orders.qr_token)))
    .limit(1)
  if (!o) { console.log('no shipped order found'); process.exit(1) }

  // official DHD PDF
  const client = await getEcotrackClient()
  const label = await client.getLabel(o.tracking!)
  writeFileSync('scripts/proof-official-label.pdf', Buffer.from(label.base64, 'base64'))

  // internal QR PNG (encodes the signed HMAC token)
  await QRCode.toFile('scripts/proof-internal-qr.png', o.qr!, { margin: 1, width: 320 })

  console.log(`internal=${o.internal} tracking=${o.tracking}`)
  console.log('wrote scripts/proof-official-label.pdf and scripts/proof-internal-qr.png')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
