// _dashboard/integration/-server/delivery.api.ts
//
// دوال خادم إدارة تكامل ECOTRACK (Super Admin فقط).
// إعداد التوصيل يُدار حصراً من Settings → DeliveryTab (مصدر الحقيقة الوحيد).
//   - إدارة حسابات التوصيل (CRUD + اختبار اتصال)
//   - syncOrderWithEcotrack: مزامنة يدوية لحالة طلبية من ECOTRACK
//
// ملاحظة: ECOTRACK سحبيّ (pull) — لا توجد نقطة لتسجيل webhook؛ تُجلب الحالات
// دوريّاً عبر api/cron/sync-tracking.

import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { deliveryAccounts } from '#/server/db/schema'
import { and, eq, isNull, ne, desc } from 'drizzle-orm'
import { z } from 'zod'
import { syncOrderTracking } from '#/server/delivery/ecotrack-sync'
import {
  invalidateEcotrackClient,
  EcotrackService,
} from '#/server/services/ecotrack.service'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') throw new Error('Unauthorized')
  return session
}

export const syncOrderWithEcotrack = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    return syncOrderTracking(data.orderId)
  })

// ============================================================
// إدارة حسابات التوصيل (CRUD) — Super Admin
// ============================================================

export interface DeliveryAccountView {
  id: string
  name: string
  provider: string
  baseUrl: string | null // نطاق الـ API الخاص بالناقل (white-label)
  apiKeyMasked: string // آخر 8 أحرف فقط — المفتاح الكامل لا يُرسَل للعميل أبداً
  isActive: boolean
  isDefault: boolean
  createdAt: string
}

function maskKey(key: string): string {
  const tail = key.slice(-8)
  return tail ? `••••••••${tail}` : '••••••••'
}

export const getDeliveryAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DeliveryAccountView[]> => {
    await requireSuperAdmin()
    const rows = await db
      .select()
      .from(deliveryAccounts)
      .where(isNull(deliveryAccounts.deleted_at))
      .orderBy(desc(deliveryAccounts.created_at))

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      provider: r.provider,
      baseUrl: r.base_url,
      apiKeyMasked: maskKey(r.api_key),
      isActive: r.is_active,
      isDefault: r.is_default,
      createdAt: r.created_at.toISOString(),
    }))
  },
)

const CreateAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  provider: z.string().trim().min(1).max(40).default('ecotrack'),
  apiKey: z.string().trim().min(10).max(200),
  baseUrl: z.string().trim().url().max(200).optional(),
  isDefault: z.boolean().default(false),
})

export const createDeliveryAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => CreateAccountSchema.parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    await db.transaction(async (tx) => {
      // افتراضي واحد فقط لكل مزوّد
      if (data.isDefault) {
        await tx
          .update(deliveryAccounts)
          .set({ is_default: false })
          .where(
            and(
              eq(deliveryAccounts.provider, data.provider),
              isNull(deliveryAccounts.deleted_at),
            ),
          )
      }
      await tx.insert(deliveryAccounts).values({
        name: data.name,
        provider: data.provider,
        api_key: data.apiKey,
        base_url: data.baseUrl ?? null,
        is_default: data.isDefault,
      })
    })
    return { success: true }
  })

const UpdateAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  apiKey: z.string().trim().min(10).max(200).optional(),
  baseUrl: z.string().trim().url().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

export const updateDeliveryAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => UpdateAccountSchema.parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    await db.transaction(async (tx) => {
      const [acct] = await tx
        .select({ provider: deliveryAccounts.provider })
        .from(deliveryAccounts)
        .where(and(eq(deliveryAccounts.id, data.id), isNull(deliveryAccounts.deleted_at)))
        .limit(1)
      if (!acct) throw new Error('حساب التوصيل غير موجود')

      // تفعيل الافتراضي → ألغِ الافتراضي عن البقيّة (ذرّياً)
      if (data.isDefault) {
        await tx
          .update(deliveryAccounts)
          .set({ is_default: false })
          .where(
            and(
              eq(deliveryAccounts.provider, acct.provider),
              isNull(deliveryAccounts.deleted_at),
              ne(deliveryAccounts.id, data.id),
            ),
          )
      }

      const patch: Record<string, unknown> = {}
      if (data.name !== undefined) patch.name = data.name
      if (data.apiKey !== undefined) patch.api_key = data.apiKey
      if (data.baseUrl !== undefined) patch.base_url = data.baseUrl
      if (data.isActive !== undefined) patch.is_active = data.isActive
      if (data.isDefault !== undefined) patch.is_default = data.isDefault
      if (Object.keys(patch).length > 0) {
        await tx.update(deliveryAccounts).set(patch).where(eq(deliveryAccounts.id, data.id))
      }
    })
    invalidateEcotrackClient(data.id)
    return { success: true }
  })

export const toggleDeliveryAccountStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    const [acct] = await db
      .select({ isActive: deliveryAccounts.is_active })
      .from(deliveryAccounts)
      .where(and(eq(deliveryAccounts.id, data.id), isNull(deliveryAccounts.deleted_at)))
      .limit(1)
    if (!acct) throw new Error('حساب التوصيل غير موجود')

    const next = !acct.isActive
    await db
      .update(deliveryAccounts)
      .set({ is_active: next })
      .where(eq(deliveryAccounts.id, data.id))
    invalidateEcotrackClient(data.id)
    return { success: true, isActive: next }
  })

export const deleteDeliveryAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireSuperAdmin()
    await db
      .update(deliveryAccounts)
      .set({ deleted_at: new Date(), is_default: false })
      .where(eq(deliveryAccounts.id, data.id))
    invalidateEcotrackClient(data.id)
    return { success: true }
  })

export const testDeliveryAccountConnection = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    await requireSuperAdmin()
    const [acct] = await db
      .select({ apiKey: deliveryAccounts.api_key, baseUrl: deliveryAccounts.base_url })
      .from(deliveryAccounts)
      .where(and(eq(deliveryAccounts.id, data.id), isNull(deliveryAccounts.deleted_at)))
      .limit(1)
    if (!acct) return { success: false, message: 'الحساب غير موجود' }

    // عميل جديد بالمفتاح المخزَّن (يتجاوز الكاش وفحص التفعيل)
    try {
      const client = new EcotrackService(acct.apiKey, { baseUrl: acct.baseUrl ?? undefined })
      const ok = await client.validateToken()
      if (!ok) return { success: false, message: 'التوكن غير صالح لدى ECOTRACK' }
      const fees = await client.getFees()
      return {
        success: true,
        message: `الاتصال ناجح — ${fees.length} تعرفة ولاية`,
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'فشل الاتصال' }
    }
  })
