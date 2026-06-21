import { createFileRoute } from '@tanstack/react-router'
import { getSettingsData } from './-server/settings.api'
import { useState } from 'react'
import { FinancialTab } from './-components/FinancialTab'
import { GeneralTab } from './-components/GeneralTab'
import { TeamTab } from './-components/TeamTab'
import { SecurityTab } from './-components/SecurityTab'
import { DeliveryTab } from './-components/DeliveryTab'
import { DeliveryPricingTab } from './-components/DeliveryPricingTab'

type Tab = 'financial' | 'general' | 'team' | 'security' | 'delivery' | 'pricing'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'financial', label: 'المالية', icon: '💰' },
  { id: 'general', label: 'العام والقانوني', icon: '📋' },
  { id: 'team', label: 'الفريق والصلاحيات', icon: '👥' },
  { id: 'security', label: 'الأمان', icon: '🔒' },
  { id: 'delivery', label: 'شركات التوصيل', icon: '🚚' },
  { id: 'pricing', label: 'أسعار التوصيل', icon: '🏷️' },
]

export const Route = createFileRoute('/_dashboard/settings/')({
  loader: () => getSettingsData(),
  pendingComponent: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
  component: SettingsPage,
})

function SettingsPage() {
  const data = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState<Tab>('financial')

  return (
    <div className="p-4 sm:p-6 space-y-6" dir='rtl'>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">الإعدادات</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة إعدادات المنصة</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'financial' && <FinancialTab data={data.financial} />}
        {activeTab === 'general' && <GeneralTab data={data.general} />}
        {activeTab === 'team' && <TeamTab members={data.team} />}
        {activeTab === 'security' && <SecurityTab data={data.security} />}
        {activeTab === 'delivery' && <DeliveryTab />}
        {activeTab === 'pricing' && <DeliveryPricingTab />}
      </div>
    </div>
  )
}