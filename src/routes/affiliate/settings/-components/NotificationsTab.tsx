// ============================================================
// -components/NotificationsTab.tsx
// ============================================================

import { useState } from 'react'
import { BellOff } from 'lucide-react'
import { updateNotifications } from '../-server/settings.api'
import type { NotificationSettings, NotificationPreference } from '../settings.types'

interface Props {
  settings: NotificationSettings
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-gray-900' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-1' : 'translate-x-4'
        }`}
      />
    </button>
  )
}

export function NotificationsTab({ settings: initial }: Props) {
  const [doNotDisturb, setDoNotDisturb] = useState(initial.doNotDisturb)
  const [preferences, setPreferences] = useState<NotificationPreference[]>(
    initial.preferences,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleChannel(
    prefId: string,
    channel: 'email' | 'platform',
    value: boolean,
  ) {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === prefId
          ? { ...p, channels: { ...p.channels, [channel]: value } }
          : p,
      ),
    )
  }

  async function handleSave() {
    setIsSaving(true)
    await updateNotifications({
      data: { doNotDisturb, preferences },
    })
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-4">
      {/* وضع عدم الإزعاج */}
      <div
        className={`rounded-xl border p-4 transition-colors ${
          doNotDisturb ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                doNotDisturb ? 'bg-amber-100' : 'bg-gray-100'
              }`}
            >
              <BellOff
                size={15}
                className={doNotDisturb ? 'text-amber-600' : 'text-gray-500'}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900">وضع عدم الإزعاج</p>
              <p className="mt-0.5 text-xs text-gray-400">
                إيقاف جميع الإشعارات مؤقتاً
              </p>
            </div>
          </div>
          <Toggle checked={doNotDisturb} onChange={setDoNotDisturb} />
        </div>
      </div>

      {/* جدول الإشعارات */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px] border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <span className="text-xs font-medium text-gray-500">الإشعار</span>
          <span className="text-center text-xs font-medium text-gray-500">إيميل</span>
          <span className="text-center text-xs font-medium text-gray-500">المنصة</span>
        </div>

        {/* Rows */}
        {preferences.map((pref, i) => (
          <div
            key={pref.id}
            className={`grid grid-cols-[1fr_80px_80px] items-center px-4 py-3 ${
              i < preferences.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div>
              <p className="text-xs font-medium text-gray-800">{pref.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{pref.description}</p>
            </div>
            <div className="flex justify-center">
              <Toggle
                checked={pref.channels.email && !doNotDisturb}
                onChange={(v) => toggleChannel(pref.id, 'email', v)}
                disabled={doNotDisturb}
              />
            </div>
            <div className="flex justify-center">
              <Toggle
                checked={pref.channels.platform && !doNotDisturb}
                onChange={(v) => toggleChannel(pref.id, 'platform', v)}
                disabled={doNotDisturb}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-start">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`rounded-lg px-5 py-2 text-xs font-medium transition-colors ${
            saved ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
          } disabled:opacity-60`}
        >
          {isSaving ? 'جارٍ الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  )
}