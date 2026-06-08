// scripts/repair-accounts.mjs — fix the test accounts shaped wrong by Issue #1.
//  +2  merchant ("merchant"):  affiliate → merchant  (+ merchant_profile, drop stray affiliate_profile)
//  +1  affiliate:              pending   → active
// Idempotent. Run: node scripts/repair-accounts.mjs
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
const MERCHANT_EMAIL = 'abdelwakilbenmoussa+2@gmail.com'
const AFFILIATE_EMAIL = 'abdelwakilbenmoussa+1@gmail.com'

try {
  await sql.begin(async (tx) => {
    // ── +2 → merchant ────────────────────────────────────────
    const [m] = await tx`SELECT id, role, status FROM users WHERE email = ${MERCHANT_EMAIL} AND deleted_at IS NULL LIMIT 1`
    if (!m) throw new Error(`merchant user not found: ${MERCHANT_EMAIL}`)

    // find its affiliate_profile (if any) and ensure nothing references it
    const [ap] = await tx`SELECT id FROM affiliate_profiles WHERE user_id = ${m.id} LIMIT 1`
    if (ap) {
      const [{ n: linkRefs }] = await tx`SELECT COUNT(*)::int AS n FROM tracking_links WHERE affiliate_id = ${ap.id}`
      const [{ n: orderRefs }] = await tx`SELECT COUNT(*)::int AS n FROM orders WHERE affiliate_id = ${ap.id}`
      if (linkRefs === 0 && orderRefs === 0) {
        await tx`DELETE FROM affiliate_profiles WHERE id = ${ap.id}`
        console.log(`  • removed stray affiliate_profile for +2 (no FK refs)`)
      } else {
        await tx`UPDATE affiliate_profiles SET deleted_at = now() WHERE id = ${ap.id}`
        console.log(`  • soft-deleted affiliate_profile for +2 (${linkRefs} links, ${orderRefs} orders referenced)`)
      }
    }

    await tx`UPDATE users SET role = 'merchant', status = 'active', approved_at = COALESCE(approved_at, now()) WHERE id = ${m.id}`

    // create merchant_profile if missing (unique on user_id)
    const [mp] = await tx`SELECT id FROM merchant_profiles WHERE user_id = ${m.id} LIMIT 1`
    if (!mp) {
      await tx`INSERT INTO merchant_profiles (user_id, business_name) VALUES (${m.id}, 'merchant')`
      console.log(`  • created merchant_profile "merchant" for +2`)
    } else {
      await tx`UPDATE merchant_profiles SET business_name = 'merchant', deleted_at = NULL WHERE id = ${mp.id}`
      console.log(`  • merchant_profile already existed for +2 (ensured active)`)
    }

    // ── +1 → active affiliate ────────────────────────────────
    const [a] = await tx`SELECT id, role, status FROM users WHERE email = ${AFFILIATE_EMAIL} AND deleted_at IS NULL LIMIT 1`
    if (a) {
      await tx`UPDATE users SET status = 'active', approved_at = COALESCE(approved_at, now()) WHERE id = ${a.id}`
      console.log(`  • activated affiliate +1`)
    }
  })

  console.log('\n=== Final account state ===')
  const rows = await sql`
    SELECT u.email, u.role, u.status,
           (SELECT COUNT(*)::int FROM merchant_profiles mp WHERE mp.user_id = u.id AND mp.deleted_at IS NULL)  AS merchant_profiles,
           (SELECT COUNT(*)::int FROM affiliate_profiles ap WHERE ap.user_id = u.id AND ap.deleted_at IS NULL) AS affiliate_profiles
    FROM users u
    WHERE u.email IN (${MERCHANT_EMAIL}, ${AFFILIATE_EMAIL}, 'abdelwakilbenmoussa@gmail.com')
    ORDER BY u.email`
  console.table(rows)
} catch (e) {
  console.error('REPAIR ERROR:', e.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
