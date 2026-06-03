// ============================================================
// index.tsx — /affiliate/settings
// ============================================================

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { User, CreditCard, Bell, Lock } from 'lucide-react'
import { getSettingsData } from './-server/settings.api'
import { ProfileTab } from './-components/ProfileTab'
import { PayoutTab } from './-components/PayoutTab'
import { NotificationsTab } from './-components/NotificationsTab'
import { SecurityTab } from './-components/SecurityTab'
import type { SettingsTab } from './-settings.types'

// ─── Route ───────────────────────────────────────────────────
export const Route = createFileRoute('/affiliate/settings/')({
  loader: () => getSettingsData(),

  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  ),

  component: SettingsPage,
})

// ─── Sidebar Nav Config ──────────────────────────────────────
const NAV_ITEMS: {
  id: SettingsTab
  label: string
  description: string
  icon: React.ReactNode
  badge?: string
}[] = [
  {
    id: 'profile',
    label: 'الملف الشخصي',
    description: 'اسمك ورابطك ومعلوماتك',
    icon: <User size={15} />,
  },
  {
    id: 'payout',
    label: 'الحسابات المالية',
    description: 'CCP، BaridiMob، بنكي',
    icon: <CreditCard size={15} />,
    badge: 'مهم',
  },
  {
    id: 'notifications',
    label: 'الإشعارات',
    description: 'تحكم في التنبيهات',
    icon: <Bell size={15} />,
  },
  {
    id: 'security',
    label: 'الأمان',
    description: 'كلمة المرور والأجهزة',
    icon: <Lock size={15} />,
  },
]

const TAB_TITLES: Record<SettingsTab, { title: string; subtitle: string }> = {
  profile: { title: 'الملف الشخصي', subtitle: 'معلوماتك الشخصية وهويتك على المنصة' },
  payout: { title: 'الحسابات المالية', subtitle: 'طرق الدفع التي ستُحوَّل إليها أرباحك' },
  notifications: { title: 'الإشعارات', subtitle: 'تحكم في التنبيهات التي تصلك' },
  security: { title: 'الأمان', subtitle: 'كلمة المرور والأجهزة المتصلة بحسابك' },
}

// ─── Page Component ──────────────────────────────────────────
function SettingsPage() {
  const data = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const { title, subtitle } = TAB_TITLES[activeTab]

  return (
    <div className="p-6" dir='rtl'>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-sm text-gray-500">إدارة حسابك وتفضيلاتك</p>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex gap-6 items-start">
        {/* ─── Sidebar ─────────────────────────────────────── */}
        <nav className="w-52 shrink-0 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-right transition-colors ${
                activeTab === item.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={activeTab === item.id ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs ${
                          activeTab === item.id
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      activeTab === item.id ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* ─── Content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Section Header */}
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>

          {/* Tab Content — SPA, no page reload */}
          {activeTab === 'profile' && <ProfileTab profile={data.profile} />}
          {activeTab === 'payout' && <PayoutTab methods={data.payoutMethods} />}
          {activeTab === 'notifications' && (
            <NotificationsTab settings={data.notifications} />
          )}
          {activeTab === 'security' && <SecurityTab security={data.security} />}
        </div>
      </div>
    </div>
  )
}