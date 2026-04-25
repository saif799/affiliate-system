// ============================================================
// -server/settings.api.ts
// ============================================================

import { createServerFn } from '@tanstack/react-start'
import { mockSettingsData } from './settings.mock'
import type {
  SettingsData,
  UpdateProfileForm,
  AddPayoutMethodForm,
  ChangePasswordForm,
  NotificationSettings,
  PayoutMethod,
} from '../settings.types'

// جلب كل بيانات الإعدادات
export const getSettingsData = createServerFn({
  method: 'GET',
}).handler(async (): Promise<SettingsData> => {
  // لاحقاً: db.query.affiliates.findFirst({ where: eq(affiliates.id, ctx.affiliateId), with: { payoutMethods, sessions } })
  return mockSettingsData
})

// تحديث الملف الشخصي
export const updateProfile = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): UpdateProfileForm => data as UpdateProfileForm)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // لاحقاً: await db.update(affiliates).set({ fullName: data.fullName, ... }).where(...)
    console.log('Updating profile:', data)
    return { success: true }
  })

// إضافة طريقة دفع جديدة
export const addPayoutMethod = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): AddPayoutMethodForm => data as AddPayoutMethodForm)
  .handler(async ({ data }): Promise<PayoutMethod> => {
    // لاحقاً: await db.insert(payoutMethods).values({ ... }).returning()
    const newMethod: PayoutMethod = {
      id: `pm-${Date.now()}`,
      label: data.label,
      account:
        data.type === 'ccp'
          ? { type: 'ccp', accountNumber: data.ccpAccount!, key: data.ccpKey! }
          : data.type === 'baridimob'
            ? { type: 'baridimob', rip: data.rip! }
            : { type: 'bank', bankName: data.bankName!, accountNumber: data.bankAccount!, rib: data.rib! },
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    return newMethod
  })

// حذف طريقة دفع
export const deletePayoutMethod = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): { id: string } => data as { id: string })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // لاحقاً: await db.delete(payoutMethods).where(eq(payoutMethods.id, data.id))
    console.log('Deleting payout method:', data.id)
    return { success: true }
  })

// تعيين الحساب الافتراضي
export const setDefaultPayoutMethod = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): { id: string } => data as { id: string })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // لاحقاً: transaction — reset all isDefault then set the new one
    console.log('Setting default payout:', data.id)
    return { success: true }
  })

// حفظ إعدادات الإشعارات
export const updateNotifications = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): NotificationSettings => data as NotificationSettings)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // لاحقاً: await db.update(affiliateSettings).set({ notifications: data }).where(...)
    console.log('Updating notifications:', data)
    return { success: true }
  })

// تغيير كلمة المرور
export const changePassword = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown): ChangePasswordForm => data as ChangePasswordForm)
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    // لاحقاً: verify current password with bcrypt, then hash & update
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'كلمتا المرور غير متطابقتين' }
    }
    console.log('Changing password')
    return { success: true }
  })

// تسجيل الخروج من كل الأجهزة
export const revokeAllSessions = createServerFn({
  method: 'POST',
}).handler(async (): Promise<{ success: boolean }> => {
  // لاحقاً: await db.delete(sessions).where(and(eq(sessions.affiliateId, ctx.id), ne(sessions.id, ctx.sessionId)))
  return { success: true }
})