// scripts/verify-auth.ts — proves Issue #1 fix against the REAL better-auth stack + DB.
// Run: npx tsx scripts/verify-auth.ts
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
  const { auth } = await import('#/server/auth')
  const { db } = await import('#/server/db')
  const { users, merchantProfiles, affiliateProfiles } = await import('#/server/db/schema')
  const { eq } = await import('drizzle-orm')

  const stamp = Date.now()
  const cases = [
    { label: 'merchant signup',     email: `__t_m_${stamp}@example.com`, sendRole: 'merchant',    expectRole: 'merchant' },
    { label: 'affiliate signup',    email: `__t_a_${stamp}@example.com`, sendRole: 'affiliate',   expectRole: 'affiliate' },
    { label: 'escalation attempt',  email: `__t_x_${stamp}@example.com`, sendRole: 'super_admin', expectRole: 'affiliate' },
    { label: 'no role provided',    email: `__t_n_${stamp}@example.com`, sendRole: undefined,      expectRole: 'affiliate' },
  ]

  let allPass = true
  const createdUserIds: string[] = []

  for (const c of cases) {
    try {
      await auth.api.signUpEmail({
        body: {
          name: c.label,
          email: c.email,
          password: 'Passw0rd!23',
          ...(c.sendRole ? { role: c.sendRole } : {}),
        } as any,
      })
    } catch (e: any) {
      console.log(`  [${c.label}] signUp threw:`, e?.message)
    }

    const [u] = await db
      .select({ id: users.id, role: users.role, status: users.status })
      .from(users)
      .where(eq(users.email, c.email))
      .limit(1)

    if (!u) {
      console.log(`❌ [${c.label}] no user row created`)
      allPass = false
      continue
    }
    createdUserIds.push(u.id)

    const [mp] = await db.select({ id: merchantProfiles.id }).from(merchantProfiles).where(eq(merchantProfiles.user_id, u.id)).limit(1)
    const [ap] = await db.select({ id: affiliateProfiles.id }).from(affiliateProfiles).where(eq(affiliateProfiles.user_id, u.id)).limit(1)

    const roleOk   = u.role === c.expectRole
    const statusOk = u.status === 'pending'
    const profileOk =
      c.expectRole === 'merchant'  ? (!!mp && !ap) :
      c.expectRole === 'affiliate' ? (!!ap && !mp) : false

    const ok = roleOk && statusOk && profileOk
    allPass &&= ok
    console.log(
      `${ok ? '✅' : '❌'} [${c.label}] sent=${c.sendRole ?? '(none)'} → role=${u.role} status=${u.status} ` +
      `merchantProfile=${!!mp} affiliateProfile=${!!ap} ` +
      `(expect role=${c.expectRole}, status=pending)`,
    )
  }

  // ── cleanup: profiles first (FK restrict), then users (cascades accounts/sessions) ──
  for (const id of createdUserIds) {
    await db.delete(merchantProfiles).where(eq(merchantProfiles.user_id, id))
    await db.delete(affiliateProfiles).where(eq(affiliateProfiles.user_id, id))
    await db.delete(users).where(eq(users.id, id))
  }
  console.log(`\n🧹 cleaned up ${createdUserIds.length} test users`)
  console.log(allPass ? '\n🎉 ALL CASES PASS — Issue #1 fixed & escalation blocked' : '\n⚠️ SOME CASES FAILED')
  process.exit(allPass ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
