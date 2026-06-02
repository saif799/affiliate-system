import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getSettingsData } from './-server/settings.api'
import type { SettingsTab } from './-settings.types'

import SettingsSidebar from './-components/SettingsSidebar'
import ProfileTab from './-components/ProfileTab'
import PayoutTab from './-components/PayoutTab'
import NotificationsTab from './-components/NotificationsTab'
import SecurityTab from './-components/SecurityTab'

export const Route = createFileRoute('/merchant/settings/')({
  loader: () => getSettingsData(),
  pendingComponent: SettingsSkeleton,
  component: SettingsPage,
})

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <main className="page-wrap px-4 py-8" dir="rtl">
      <div className="mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-1" />
      </div>
      <div className="flex gap-0 rounded-2xl border border-gray-200 bg-white overflow-hidden min-h-145">
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-gray-100 animate-pulse"
              style={{ width: `${60 + i * 5}%`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="w-56 bg-gray-50 border-l border-gray-200 p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SettingsPage() {
  const data = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <main className="page-wrap px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            إدارة حسابك ونشاطك التجاري
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex rounded-2xl border border-gray-200 bg-white overflow-hidden min-h-150">
        {/* Content area */}
        <div className="flex-1 p-6 overflow-hidden">
          {activeTab === 'profile' && (
            <ProfileTab data={data.profile} />
          )}
          {activeTab === 'payout' && (
            <PayoutTab data={data.payout} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab data={data.notifications} />
          )}
          {activeTab === 'security' && (
            <SecurityTab sessions={data.security.sessions} />
          )}
        </div>

        {/* Sidebar nav */}
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </main>
  )
}