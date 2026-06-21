import type { SettingsTab } from '../-settings.types'

interface Props {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'الملف الشخصي',
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="8" cy="5" r="3" />
        <path d="M2 13c0-3 2.7-5 6-5s6 2 6 5" />
      </svg>
    ),
  },
  {
    id: 'payout',
    label: 'طرق الدفع',
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="4" width="12" height="9" rx="1.5" />
        <path d="M2 7h12" />
        <circle cx="5.5" cy="10.5" r="1" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'الإشعارات',
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M8 2a5 5 0 0 1 5 5v2l1 2H2l1-2V7a5 5 0 0 1 5-5z" />
        <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'الأمان',
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M8 2L3 4v4c0 3 2 5.5 5 6.5C11 13.5 13 11 13 8V4L8 2z" />
      </svg>
    ),
  },
]

export default function SettingsSidebar({ activeTab, onTabChange }: Props) {
  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-gray-50 py-4 lg:w-56 lg:flex lg:flex-col lg:border-b-0 lg:border-s lg:border-gray-200 lg:py-6">
      <p className="hidden px-4 mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 lg:block">
        إعدادات الحساب
      </p>

      <nav className="flex flex-row gap-0.5 overflow-x-auto px-2 lg:flex-col lg:overflow-visible">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-right lg:w-full lg:shrink ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
            }`}
          >
            <span
              className={
                activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'
              }
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}