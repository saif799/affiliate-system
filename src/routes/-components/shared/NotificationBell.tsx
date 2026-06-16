'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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

export function NotificationBell({ seeAllHref }: { seeAllHref?: string } = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // إحداثيات ثابتة محسوبة من موضع الجرس — كي تُعرَض اللوحة عبر بوابة (portal)
  // فوق كل شيء دون أن يقصّها حاوي التمرير (overflow) في الشريط الجانبي الضيّق.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

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
      const t = e.target as Node
      // استثنِ زرّ الجرس واللوحة المنبثقة (صارت خارج ref بسبب الـ portal)
      if (
        ref.current &&
        !ref.current.contains(t) &&
        (!panelRef.current || !panelRef.current.contains(t))
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // احسب موضع اللوحة المنبثقة من مستطيل الجرس (RTL: محاذاة لليمين، تنمو يساراً)
  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    function update() {
      const el = btnRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const PANEL_W = 288 // w-72
      // محاذاة يسار اللوحة لحافة الجرس، ثم اقلب إن تجاوزت حافّة الشاشة اليمنى
      // (يعمل سواء كان الشريط الجانبي يساراً أو يميناً) مع تثبيت داخل الإطار.
      let left = r.left
      if (left + PANEL_W > window.innerWidth - 8) left = r.right - PANEL_W
      left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - PANEL_W - 8))
      setPos({ top: r.bottom + 8, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true) // capture: يلتقط تمرير الشريط الجانبي
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

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
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-label="الإشعارات"
      >
        <Bell size={17} />
        {unread > 0 && (
          // شارة بارزة: حجم متّسق، حدّ أبيض للفصل عن الخلفية، تموضع مريح خارج الجرس
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
            dir="ltr"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            dir="rtl"
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
            className="z-[1000] w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-gray-200 bg-white shadow-lg"
          >
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
                لا إشعارات غير مقروءة
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

          {seeAllHref && (
            <button
              onClick={() => {
                setOpen(false)
                router.navigate({ to: seeAllHref as '/' })
              }}
              className="block w-full border-t border-gray-100 px-3 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-gray-50"
            >
              عرض كل الإشعارات
            </button>
          )}
          </div>,
          document.body,
        )}
    </div>
  )
}
