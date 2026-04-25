import { createServerFn } from '@tanstack/react-start'
import { mockSettingsData } from './settings.mock'
import type {
  SettingsData,
  ProfileData,
  PayoutData,
  NotificationsData,
} from '../settings.types'

export const getSettingsData = createServerFn({
  method: 'GET',
}).handler(async (): Promise<SettingsData> => {
  // TODO: replace with Drizzle ORM query
  // const merchant = await db.query.merchants.findFirst({ where: eq(merchants.id, ctx.merchantId) })
  return mockSettingsData
})

export const updateProfile = createServerFn({
  method: 'POST',
}).inputValidator((data: ProfileData) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // TODO: await db.update(merchants).set({ ...data }).where(eq(merchants.id, ctx.merchantId))
    console.log('Updating profile:', data)
    return { success: true }
  })

export const updatePayout = createServerFn({
  method: 'POST',
}).inputValidator((data: PayoutData) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // TODO: await db.update(payoutSettings).set({ ...data }).where(...)
    console.log('Updating payout:', data)
    return { success: true }
  })

export const updateNotifications = createServerFn({
  method: 'POST',
}).inputValidator((data: NotificationsData) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // TODO: await db.update(notificationSettings).set({ ...data }).where(...)
    console.log('Updating notifications:', data)
    return { success: true }
  })

export const updatePassword = createServerFn({
  method: 'POST',
}).inputValidator(
  (data: { currentPassword: string; newPassword: string }) => data,
).handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
  // TODO: verify currentPassword hash, then update
  if (!data.newPassword || data.newPassword.length < 8) {
    return { success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
  }
  console.log('Updating password')
  return { success: true }
})

export const terminateSession = createServerFn({
  method: 'POST',
}).inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    // TODO: await db.delete(sessions).where(eq(sessions.id, data.sessionId))
    console.log('Terminating session:', data.sessionId)
    return { success: true }
  })

export const terminateAllSessions = createServerFn({
  method: 'POST',
}).handler(async (): Promise<{ success: boolean }> => {
  // TODO: await db.delete(sessions).where(and(eq(sessions.merchantId, ctx.merchantId), ne(sessions.id, ctx.currentSessionId)))
  console.log('Terminating all other sessions')
  return { success: true }
})

export const requestAccountDeletion = createServerFn({
  method: 'POST',
}).handler(async (): Promise<{ success: boolean }> => {
  // TODO: send deletion request email + flag account
  console.log('Account deletion requested')
  return { success: true }
})