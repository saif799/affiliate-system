// src/routes/super-admin/settings/-server/settings.api.ts
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '#/server/db'
import { auth } from '#/server/auth'
import { settings, users, sessions } from '#/server/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'
import type {
  SettingsData,
  FinancialSettings,
  GeneralSettings,
  TeamMember,
  SecuritySettings,
} from '../-settings.types'

// ═══════════════════════════════════════════════════════════════
//  Auth guard — call at the top of every handler
// ═══════════════════════════════════════════════════════════════

async function requireSuperAdmin() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // role is stored as an additional field on the user object
  const role = (session.user as any).role as string | undefined
  if (role !== 'super_admin') {
    throw new Error('Forbidden')
  }

  return session.user
}

// ═══════════════════════════════════════════════════════════════
//  Defaults
// ═══════════════════════════════════════════════════════════════

const FINANCIAL_DEFAULTS: FinancialSettings = {
  platform_fee_per_order: 100,
  minimum_payout: 5000,
  payout_schedule: 'monthly',
  payout_methods: ['BaridiMob', 'CCP'],
}

const GENERAL_DEFAULTS: GeneralSettings = {
  platform_name: 'DzDrop',
  support_email: 'support@dzdrop.dz',
  terms_url: 'https://dzdrop.dz/terms',
  privacy_url: 'https://dzdrop.dz/privacy',
  maintenance_mode: false,
}

// ═══════════════════════════════════════════════════════════════
//  Key lists
// ═══════════════════════════════════════════════════════════════

const FINANCIAL_KEYS = [
  'platform_fee_per_order',
  'minimum_payout',
  'payout_schedule',
  'payout_methods',
] as const

const GENERAL_KEYS = [
  'platform_name',
  'support_email',
  'terms_url',
  'privacy_url',
  'maintenance_mode',
] as const

// ═══════════════════════════════════════════════════════════════
//  DB helpers
// ═══════════════════════════════════════════════════════════════

type KVMap = Record<string, string>

async function fetchKeys(keys: readonly string[]): Promise<KVMap> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, keys as unknown as string[]))

  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

async function upsertKey(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updated_at: new Date() },
    })
}

// ═══════════════════════════════════════════════════════════════
//  Parsers
// ═══════════════════════════════════════════════════════════════

function parseFinancial(kv: KVMap): FinancialSettings {
  return {
    platform_fee_per_order:
      kv.platform_fee_per_order !== undefined
        ? Number(kv.platform_fee_per_order)
        : FINANCIAL_DEFAULTS.platform_fee_per_order,

    minimum_payout:
      kv.minimum_payout !== undefined
        ? Number(kv.minimum_payout)
        : FINANCIAL_DEFAULTS.minimum_payout,

    payout_schedule:
      (kv.payout_schedule as FinancialSettings['payout_schedule']) ??
      FINANCIAL_DEFAULTS.payout_schedule,

    payout_methods:
      kv.payout_methods !== undefined
        ? (JSON.parse(kv.payout_methods) as FinancialSettings['payout_methods'])
        : FINANCIAL_DEFAULTS.payout_methods,
  }
}

function parseGeneral(kv: KVMap): GeneralSettings {
  return {
    platform_name: kv.platform_name ?? GENERAL_DEFAULTS.platform_name,
    support_email: kv.support_email ?? GENERAL_DEFAULTS.support_email,
    terms_url: kv.terms_url ?? GENERAL_DEFAULTS.terms_url,
    privacy_url: kv.privacy_url ?? GENERAL_DEFAULTS.privacy_url,
    maintenance_mode:
      kv.maintenance_mode !== undefined
        ? kv.maintenance_mode === 'true'
        : GENERAL_DEFAULTS.maintenance_mode,
  }
}

// ═══════════════════════════════════════════════════════════════
//  Internal fetchers (no auth — called only from guarded handlers)
// ═══════════════════════════════════════════════════════════════

async function fetchFinancial(): Promise<FinancialSettings> {
  return parseFinancial(await fetchKeys(FINANCIAL_KEYS))
}

async function fetchGeneral(): Promise<GeneralSettings> {
  return parseGeneral(await fetchKeys(GENERAL_KEYS))
}

async function fetchTeam(): Promise<TeamMember[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      joined_at: users.approved_at,
      wilaya: users.wilaya,
    })
    .from(users)
    .where(eq(users.role, 'super_admin'))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    status: r.status,
    joined_at: r.joined_at?.toISOString() ?? '',
    wilaya: r.wilaya,
  }))
}

async function fetchSecurity(currentUserId: string): Promise<SecuritySettings> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sessions)
    .where(eq(sessions.userId, currentUserId))

  return {
    two_factor_enabled: false,
    active_sessions_count: Number(row?.count ?? 0),
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET settings
// ═══════════════════════════════════════════════════════════════

export const getSettingsData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SettingsData> => {
    // ← Auth guard: real session + super_admin role required
    const user = await requireSuperAdmin()

    const [financial, general, team, security] = await Promise.all([
      fetchFinancial(),
      fetchGeneral(),
      fetchTeam(),
      fetchSecurity(user.id), // ← always a real, verified userId
    ])

    return { financial, general, team, security }
  },
)

// ═══════════════════════════════════════════════════════════════
//  UPDATE financial
// ═══════════════════════════════════════════════════════════════

const UpdateFinancialSchema = z.object({
  platform_fee_per_order: z.number().min(0),
  minimum_payout: z.number().min(0),
  payout_schedule: z.enum(['weekly', 'biweekly', 'monthly']),
  payout_methods: z.array(z.enum(['CCP', 'BaridiMob'])).min(1),
})

export const updateFinancialSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => UpdateFinancialSchema.parse(input))
  .handler(async ({ data }): Promise<FinancialSettings> => {
    await requireSuperAdmin()

    await Promise.all([
      upsertKey('platform_fee_per_order', String(data.platform_fee_per_order)),
      upsertKey('minimum_payout', String(data.minimum_payout)),
      upsertKey('payout_schedule', data.payout_schedule),
      upsertKey('payout_methods', JSON.stringify(data.payout_methods)),
    ])

    return data
  })

// ═══════════════════════════════════════════════════════════════
//  UPDATE general
// ═══════════════════════════════════════════════════════════════

const UpdateGeneralSchema = z.object({
  platform_name: z.string().min(1),
  support_email: z.string().email(),
  terms_url: z.string().url(),
  privacy_url: z.string().url(),
  maintenance_mode: z.boolean(),
})

export const updateGeneralSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => UpdateGeneralSchema.parse(input))
  .handler(async ({ data }): Promise<GeneralSettings> => {
    await requireSuperAdmin()

    await Promise.all([
      upsertKey('platform_name', data.platform_name),
      upsertKey('support_email', data.support_email),
      upsertKey('terms_url', data.terms_url),
      upsertKey('privacy_url', data.privacy_url),
      upsertKey('maintenance_mode', String(data.maintenance_mode)),
    ])

    return data
  })

// ═══════════════════════════════════════════════════════════════
//  INVITE team member (Magic Link)
// ═══════════════════════════════════════════════════════════════

const InviteTeamSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.literal('super_admin'),
})

export const inviteTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => InviteTeamSchema.parse(input))
  .handler(async ({ data }): Promise<TeamMember> => {
    await requireSuperAdmin()

    const email = data.email.toLowerCase().trim()

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    // Guard: refuse to re-invite an already-active super admin
    if (
      existing &&
      existing.role === 'super_admin' &&
      existing.status === 'active'
    ) {
      throw new Error('هذا المستخدم أدمن نشط مسبقاً')
    }

    let userId: string

    if (existing) {
      userId = existing.id
      await db
        .update(users)
        .set({ name: data.name, role: 'super_admin', status: 'pending' })
        .where(eq(users.email, email))
    } else {
      userId = crypto.randomUUID()
      await db.insert(users).values({
        id: userId,
        name: data.name,
        email: email,
        emailVerified: true,
        role: 'super_admin',
        status: 'active',
      })
    }

    try {
      await auth.api.signInMagicLink({
        body: { email, callbackURL: '/set-password' },
        headers: new Headers(),
      })
    } catch (err) {
      console.error('❌ signInMagicLink error:', err)
      throw err
    }

    const [created] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!created) throw new Error(`User not found: ${email}`)

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      status: created.status,
      joined_at: created.approved_at?.toISOString() ?? new Date().toISOString(),
      wilaya: created.wilaya,
    }
  })
