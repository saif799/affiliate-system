'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '#/server/notifications'

type Item = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return `منذ ${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} س`
  return `منذ ${Math.floor(h / 24)} ي`
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await getMyNotifications()
      setItems(res.items as Item[])
      setUnread(res.unreadCount)
    } catch {
      /* تجاهل أخطاء التحميل */
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 60000) // تحديث دوري كل دقيقة
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleClick(item: Item) {
    if (!item.readAt) {
      try {
        await markNotificationRead({ data: { id: item.id } })
      } catch {
        /* تجاهل */
      }
    }
    setOpen(false)
    await load()
    if (item.link) router.navigate({ to: item.link as '/' })
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead()
    } catch {
      /* تجاهل */
    }
    await load()
  }

  return (
    <div className="relative" ref={ref} dir="rtl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="الإشعارات"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <span className="text-sm font-semibold text-gray-900">الإشعارات</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-blue-600 hover:underline"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-gray-400">
                لا توجد إشعارات
              </p>
            ) : (
              items.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleClick(i)}
                  className={`block w-full border-b border-gray-50 px-3 py-2.5 text-right transition-colors hover:bg-gray-50 ${
                    i.readAt ? 'bg-white' : 'bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!i.readAt && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-900">
                        {i.title}
                      </p>
                      {i.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                          {i.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {timeAgo(i.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
