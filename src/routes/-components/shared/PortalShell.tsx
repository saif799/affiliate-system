'use client'

// ============================================================
// هيكل البوابة المشترك (أدمن/تاجر/مسوّق) مع شريط جانبي متجاوب:
//   - على الشاشات الكبيرة (lg+): شريط جانبي ثابت كالمعتاد.
//   - على الجوّال: الشريط مخفيّ خلف زرّ قائمة (☰) يفتحه كدرج منزلق.
// يوحّد التجاوب عبر البوابات الثلاث بدل تكراره في كل تخطيط.
// ============================================================

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NotificationBell } from './NotificationBell'

export interface PortalNavItem {
  label: string
  to: string
  icon: LucideIcon
}

interface PortalShellProps {
  brand: { label: string; icon: LucideIcon; colorClass: string }
  navItems: PortalNavItem[]
  user: { name: string; roleLabel: string; avatarBg: string; avatarFg: string }
  seeAllHref?: string
  footer?: ReactNode
  children: ReactNode
}

export function PortalShell({
  brand,
  navItems,
  user,
  seeAllHref,
  footer,
  children,
}: PortalShellProps) {
  const [open, setOpen] = useState(false)
  const BrandIcon = brand.icon

  // محتوى الشريط الجانبي — يُعاد استخدامه في النسخة الثابتة (سطح المكتب)
  // وفي الدرج المنزلق (الجوّال) لتفادي التكرار.
  const sidebarBody = (
    <div className="flex h-full flex-col justify-between" dir="rtl">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mb-5 flex items-center justify-between gap-2 px-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${brand.colorClass}`}
            >
              <BrandIcon size={16} strokeWidth={2.5} />
            </div>
            <span className="truncate text-sm font-semibold text-gray-900">
              {brand.label}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell seeAllHref={seeAllHref} />
            {/* زرّ إغلاق الدرج — على الجوّال فقط */}
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 lg:hidden"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-gray-100 px-3 py-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${user.avatarBg} ${user.avatarFg}`}
          >
            <User size={14} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-800">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-500">{user.roleLabel}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              activeProps={{
                className:
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-gray-100 font-medium text-gray-900',
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {footer && <div className="flex flex-col gap-2 pt-3">{footer}</div>}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── الشريط الجانبي الثابت — سطح المكتب فقط (lg+) ── */}
      <aside className="hidden w-56 shrink-0 border-l border-gray-200 bg-white px-3 py-5 lg:flex">
        {sidebarBody}
      </aside>

      {/* ── الدرج المنزلق + الخلفية المعتمة — الجوّال فقط ── */}
      {open && (
        <>
          <button
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col border-l border-gray-200 bg-white px-3 py-5 shadow-2xl lg:hidden">
            {sidebarBody}
          </aside>
        </>
      )}

      {/* ── المنطقة الرئيسية ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* شريط علوي للجوّال — زرّ القائمة + العلامة */}
        <header
          className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 lg:hidden"
          dir="rtl"
        >
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-900">
              {brand.label}
            </span>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${brand.colorClass}`}
            >
              <BrandIcon size={14} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
