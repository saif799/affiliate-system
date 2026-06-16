// أنواع صفحة الإشعارات (التاجر)

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}
