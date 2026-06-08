// scripts/verify-logins.ts — verify the 3 test accounts authenticate with the
// stated password; if a credential check fails, set it to the intended password
// (the user supplied these as the canonical test credentials).
// Run: npx tsx scripts/verify-logins.ts
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

const PASSWORD = 'wakilo123@'
const ACCOUNTS = [
  'abdelwakilbenmoussa@gmail.com',
  'abdelwakilbenmoussa+1@gmail.com',
  'abdelwakilbenmoussa+2@gmail.com',
]

async function main() {
  const { auth } = await import('#/server/auth')
  const { db } = await import('#/server/db')
  const { users, accounts } = await import('#/server/db/schema')
  const { eq, and } = await import('drizzle-orm')
  const ctx = await auth.$context

  for (const email of ACCOUNTS) {
    let ok = false
    try {
      const res = await auth.api.signInEmail({ body: { email, password: PASSWORD }, asResponse: true })
      ok = res.status === 200
    } catch {
      ok = false
    }

    if (!ok) {
      // set the canonical password on the credential account
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
      if (!u) { console.log(`❌ ${email} — no user row`); continue }
      const hash = await ctx.password.hash(PASSWORD)
      const updated = await db
        .update(accounts)
        .set({ password: hash })
        .where(and(eq(accounts.userId, u.id), eq(accounts.providerId, 'credential')))
        .returning({ id: accounts.id })
      if (updated.length === 0) {
        // no credential account yet (e.g. invite flow never set a password) → create one
        await db.insert(accounts).values({
          id: crypto.randomUUID(),
          userId: u.id,
          accountId: u.id,
          providerId: 'credential',
          password: hash,
        })
      }
      // re-verify
      const res2 = await auth.api.signInEmail({ body: { email, password: PASSWORD }, asResponse: true })
      console.log(`🔧 ${email} — password set to '${PASSWORD}', login now ${res2.status === 200 ? 'OK ✅' : 'FAIL ❌'}`)
    } else {
      console.log(`✅ ${email} — login OK with '${PASSWORD}'`)
    }
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
