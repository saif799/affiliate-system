'use client'

// ============================================================
// صفحة إشعارات التاجر — كل الإشعارات + تنبيهات الإدارة القابلة للرد.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  Bell,
  Package,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Info,
  CheckCheck,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react'
import {
  getMyNotificationsPage,
  markNotificationRead,
  markAllNotificationsRead,
  getMyWarnings,
} from '../-server/notifications.api'
import type { MyWarning } from '../-server/notifications.api'
import type { NotificationItem } from '../-notifications.types'
import { WarningThreadModal } from '#/routes/-components/shared/WarningThreadModal'

const ACCENT_TEXT = 'text-orange-600'
const ACCENT_RING = 'ring-orange-400'

const TYPE_STYLES: Record<string, { icon: typeof Bell; bg: string; fg: string }> = {
  order_new: { icon: Package, bg: 'bg-blue-100', fg: 'text-blue-600' },
  order_status: { icon: Package, bg: 'bg-blue-100', fg: 'text-blue-600' },
  commission_earned: { icon: TrendingUp, bg: 'bg-violet-100', fg: 'text-violet-600' },
  earning_received: { icon: Wallet, bg: 'bg-green-100', fg: 'text-green-600' },
  withdrawal_request: { icon: Wallet, bg: 'bg-amber-100', fg: 'text-amber-600' },
  withdrawal_update: { icon: Wallet, bg: 'bg-amber-100', fg: 'text-amber-600' },
  low_stock: { icon: AlertTriangle, bg: 'bg-orange-100', fg: 'text-orange-600' },
  system: { icon: Info, bg: 'bg-gray-100', fg: 'text-gray-600' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return `منذ ${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} س`
  const d = Math.floor(h / 24)
  if (d < 30) return `منذ ${d} ي`
  return new Date(iso).toLocaleDateString('ar-DZ')
}

export function NotificationsView() {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [warnings, setWarnings] = useState<MyWarning[]>([])
  const [openWarningId, setOpenWarningId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [rows, wrows] = await Promise.all([
        getMyNotificationsPage(),
        getMyWarnings().catch(() => [] as MyWarning[]),
      ])
      setItems(rows as NotificationItem[])
      setWarnings(wrows)
    } catch {
      /* تجاهل أخطاء التحميل */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unread = items.filter((i) => !i.readAt).length

  async function handleClick(item: NotificationItem) {
    setActiveId(item.id) // تظليل بسيط على الإشعار المنقور
    if (!item.readAt) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i)),
      )
      try {
        await markNotificationRead({ data: { id: item.id } })
      } catch {
        /* تجاهل */
      }
    }
    if (item.link) router.navigate({ to: item.link as '/' })
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((i) => (i.readAt ? i : { ...i, readAt: new Date().toISOString() })))
    try {
      await markAllNotificationsRead()
    } catch {
      /* تجاهل */
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Bell size={18} className={ACCENT_TEXT} />
            الإشعارات
          </h1>
          <p className="text-xs text-gray-400">
            {unread > 0 ? `لديك ${unread} إشعار غير مقروء` : 'كل الإشعارات مقروءة'}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <CheckCheck size={14} />
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {/* تنبيهات الإدارة — قابلة للرد */}
      {warnings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-4 py-2.5">
            <AlertTriangle size={15} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">تنبيهات الإدارة</span>
            <span className="text-xs text-amber-500">— اضغط للرد على الإدارة</span>
          </div>
          {warnings.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setOpenWarningId(w.id)}
              className="flex w-full items-start gap-3 border-b border-amber-50 px-4 py-3 text-right transition-colors last:border-0 hover:bg-amber-50/50"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-gray-800">{w.message}</p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{timeAgo(w.sentAt)}</span>
                  {w.replyCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <MessageSquare size={11} /> {w.replyCount} ردّ
                    </span>
                  )}
                </p>
              </div>
              <ChevronLeft size={16} className="mt-1 shrink-0 text-amber-400" />
            </button>
          ))}
        </div>
      )}

      {/* قائمة الإشعارات */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-gray-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Bell size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">لا توجد إشعارات بعد</p>
          </div>
        ) : (
          items.map((i) => {
            const style = TYPE_STYLES[i.type] ?? TYPE_STYLES.system
            const Icon = style.icon
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => handleClick(i)}
                className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3.5 text-right transition-colors last:border-0 hover:bg-gray-50 ${
                  activeId === i.id
                    ? `bg-gray-50 ring-2 ring-inset ${ACCENT_RING}`
                    : i.readAt
                      ? 'bg-white'
                      : 'bg-blue-50/40'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.fg}`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!i.readAt && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <p className="truncate text-sm font-medium text-gray-900">{i.title}</p>
                  </div>
                  {i.body && (
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{i.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(i.createdAt)}</p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {openWarningId && (
        <WarningThreadModal
          warningId={openWarningId}
          onClose={() => setOpenWarningId(null)}
          onChanged={load}
        />
      )}
    </div>
  )
}
