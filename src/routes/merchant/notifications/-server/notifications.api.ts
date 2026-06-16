// طبقة بيانات صفحة إشعارات التاجر.
// دوال الإشعارات مشتركة (يستخدمها أيضاً جرس الإشعارات) فمصدرها src/server؛
// نُعيد تصديرها هنا كي تبقى بنية المسار متّسقة مع بقية المسارات (-server/*.api.ts).
export {
  getMyNotificationsPage,
  markNotificationRead,
  markAllNotificationsRead,
} from '#/server/notifications'
export { getMyWarnings } from '#/server/warnings.api'
export type { MyWarning } from '#/server/warnings.api'
