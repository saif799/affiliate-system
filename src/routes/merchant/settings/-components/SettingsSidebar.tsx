import type { SettingsTab } from '../settings.types'

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
    <aside className="w-56 shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col py-6">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 mb-3">
        إعدادات الحساب
      </p>

      <nav className="flex flex-col gap-0.5 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right w-full ${
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