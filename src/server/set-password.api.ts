// src/routes/set-password/-server/set-password.api.ts
import { createServerFn }        from '@tanstack/react-start'
import { getRequest }            from '@tanstack/react-start/server'
import { z }                     from 'zod'
import { and, eq, isNotNull }    from 'drizzle-orm'
import { db }                    from '#/server/db'
import { auth }                  from '#/server/auth'
import { accounts }              from '#/server/db/schema'

// ── schemas ───────────────────────────────────────────────────

const SetPasswordSchema = z.object({
  password: z.string().min(8),
})

// ── helper: get authenticated session or throw ─────────────────

async function requireSession() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.id) {
    throw new Error('غير مصرح — يجب فتح الرابط أولاً')
  }

  return session.user
}

// ── checkHasPassword ──────────────────────────────────────────
//
//  Used by the route's beforeLoad to decide whether to let the
//  user see /set-password or redirect them away.
//
//  Rules:
//    • no session           → throw (beforeLoad already checked, belt-and-suspenders)
//    • has credential row   → return true  → redirect to /dashboard
//    • no credential row    → return false → show the page

export const checkHasPassword = createServerFn({ method: 'GET' }).handler(
  async (): Promise<boolean> => {
    const user = await requireSession()

    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId,     user.id),
          eq(accounts.providerId, 'credential'),
          isNotNull(accounts.password),
        ),
      )

    return !!existing
  },
)

// ── setPassword ───────────────────────────────────────────────
//
//  Hashes and persists the new password for the session owner.
//  The userId always comes from the verified session cookie —
//  the client never touches it.

export const setPassword = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => SetPasswordSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: true }> => {
    const user = await requireSession()

    // Double-guard: refuse if a credential row already exists
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId,     user.id),
          eq(accounts.providerId, 'credential'),
          isNotNull(accounts.password),
        ),
      )

    if (existing) {
      throw new Error('كلمة المرور مُعيَّنة مسبقاً — استخدم صفحة تغيير كلمة المرور')
    }

    // Hash via Better Auth's own bcrypt context (consistent with signIn)
    const ctx    = await auth.$context
    const hashed = await ctx.password.hash(data.password)

    // Upsert: insert credential row, or update if somehow already exists
    await db
      .insert(accounts)
      .values({
        id:         crypto.randomUUID(),
        userId:     user.id,
        accountId:  user.id,
        providerId: 'credential',
        password:   hashed,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      })
      .onConflictDoUpdate({
        target:  [accounts.userId, accounts.providerId],
        set:     { password: hashed, updatedAt: new Date() },
      })

    return { success: true }
  })