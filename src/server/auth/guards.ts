// ============================================================
// src/server/auth/guards.ts  — SERVER ONLY
//
// حُرّاس المصادقة/التفويض المركزيّون. مصدر واحد بدل التكرار في كل
// ملفّ *.api.ts (كان كلٌّ يُعرّف نسخته → خطر انجراف فحص الصلاحيات).
//
// يجب ألّا يستوردها أي مكوّن عميل — تستخدم db + الجلسة على الخادم.
// ============================================================

import { db } from '#/server/db'
import { getSession } from '#/lib/session'
import { affiliateProfiles, merchantProfiles } from '#/server/db/schema'
import { eq } from 'drizzle-orm'

/** أي مستخدم مُسجّل (دون تقييد دور) */
export async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

/** مدير المنصّة فقط */
export async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'super_admin') throw new Error('Unauthorized')
  return session
}

/** التاجر فقط — يُعيد الجلسة + معرّف ملفّه التجاري */
export async function requireMerchant() {
  const session = await getSession()
  if (!session || session.user.role !== 'merchant') throw new Error('Unauthorized')

  const [profile] = await db
    .select({ id: merchantProfiles.id })
    .from(merchantProfiles)
    .where(eq(merchantProfiles.user_id, session.user.id))
    .limit(1)

  if (!profile) throw new Error('Merchant profile not found')
  return { session, profileId: profile.id }
}

/** المسوّق فقط — يُعيد الجلسة + معرّف ملفّه التسويقي */
export async function requireAffiliate() {
  const session = await getSession()
  if (!session || session.user.role !== 'affiliate') throw new Error('Unauthorized')

  const [profile] = await db
    .select({ id: affiliateProfiles.id })
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.user_id, session.user.id))
    .limit(1)

  if (!profile) throw new Error('Affiliate profile not found')
  return { session, profileId: profile.id }
}
