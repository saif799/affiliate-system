// scripts/diag.mjs — READ-ONLY diagnostic of live DB state.
// Run: node scripts/diag.mjs
import { readFileSync } from 'node:fs'
import postgres from 'postgres'

for (const rawLine of readFileSync('.env', 'utf8').split('\n')) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  if (/^[A-Za-z0-9_]+$/.test(key) && process.env[key] === undefined) process.env[key] = val
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

try {
  console.log('=== USERS by role/status ===')
  console.log(await sql`SELECT role, status, COUNT(*)::int AS n FROM users WHERE deleted_at IS NULL GROUP BY role, status ORDER BY role, status`)

  console.log('\n=== Recent users (last 12) ===')
  console.log(await sql`SELECT email, role, status, email_verified AS verified, created_at FROM users ORDER BY created_at DESC LIMIT 12`)

  console.log('\n=== Profiles ===')
  const [mp] = await sql`SELECT COUNT(*)::int AS n FROM merchant_profiles WHERE deleted_at IS NULL`
  const [ap] = await sql`SELECT COUNT(*)::int AS n FROM affiliate_profiles WHERE deleted_at IS NULL`
  console.log('merchant_profiles:', mp.n, '| affiliate_profiles:', ap.n)

  console.log('\n=== Users with role=merchant but NO merchant_profile (cascade symptom) ===')
  console.log(await sql`SELECT u.email, u.role, u.status FROM users u LEFT JOIN merchant_profiles m ON m.user_id = u.id AND m.deleted_at IS NULL WHERE u.role='merchant' AND m.id IS NULL AND u.deleted_at IS NULL`)

  console.log('\n=== Users with role=affiliate who ALSO own merchant_profiles (mis-registered merchants) ===')
  console.log(await sql`SELECT u.email, u.role, u.status FROM users u JOIN merchant_profiles m ON m.user_id = u.id WHERE u.role='affiliate' AND u.deleted_at IS NULL`)

  console.log('\n=== Products ===')
  console.log(await sql`SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE is_active)::int AS active, COALESCE(SUM(stock_qty),0)::int AS total_stock FROM products WHERE deleted_at IS NULL`)

  console.log('\n=== Orders by status ===')
  console.log(await sql`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status ORDER BY status`)

  console.log('\n=== Orders: tracking / shipment fields ===')
  console.log(await sql`SELECT COUNT(*)::int AS total, COUNT(tracking_number)::int AS with_tracking, COUNT(internal_shipment_id)::int AS with_internal, COUNT(qr_token)::int AS with_qr, COUNT(label_printed_at)::int AS label_printed FROM orders`)

  console.log('\n=== Delivery accounts ===')
  console.log(await sql`SELECT name, provider, is_active, is_default, (api_key IS NOT NULL) AS has_key, base_url FROM delivery_accounts WHERE deleted_at IS NULL`)

  console.log('\n=== Delivery pricing / offices counts ===')
  const [dp] = await sql`SELECT COUNT(*)::int AS n FROM delivery_pricing`
  const [doff] = await sql`SELECT COUNT(*)::int AS n FROM delivery_offices`
  console.log('delivery_pricing wilayas:', dp.n, '| delivery_offices:', doff.n)

  console.log('\n=== Settings keys ===')
  console.log(await sql`SELECT key, value FROM settings ORDER BY key`)
} catch (e) {
  console.error('DIAG ERROR:', e.message)
} finally {
  await sql.end()
}
