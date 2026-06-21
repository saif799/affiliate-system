'use client'

import { useState } from 'react'
import type { GeneralSettings } from '../-settings.types'
import { updateGeneralSettings } from '../-server/settings.api'

interface Props {
  data: GeneralSettings
}

export function GeneralTab({ data }: Props) {
  const [form, setForm] = useState<GeneralSettings>(data)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    form.platform_name !== data.platform_name ||
    form.support_email !== data.support_email ||
    form.terms_url !== data.terms_url ||
    form.privacy_url !== data.privacy_url ||
    form.maintenance_mode !== data.maintenance_mode

  function set<TKey extends keyof GeneralSettings>(key: TKey, value: GeneralSettings[TKey]) {
    setForm((p) => ({ ...p, [key]: value }))
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    setError(null)
    if (!form.platform_name.trim()) return setError('اسم المنصة مطلوب')
    if (!/.+@.+\..+/.test(form.support_email)) return setError('بريد دعم غير صالح')
    setSaving(true)
    try {
      await updateGeneralSettings({ data: form })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('تعذّر الحفظ — تأكّد أن الروابط صحيحة (تبدأ بـ https://)')
    } finally {
      setSaving(false)
    }
  }

  const fields: {
    key: keyof Pick<
      GeneralSettings,
      'platform_name' | 'support_email' | 'terms_url' | 'privacy_url'
    >
    label: string
    type: string
    dir?: 'ltr' | 'rtl'
  }[] = [
    { key: 'platform_name', label: 'اسم المنصة', type: 'text' },
    { key: 'support_email', label: 'البريد الإلكتروني للدعم', type: 'email', dir: 'ltr' },
    { key: 'terms_url', label: 'رابط شروط الاستخدام', type: 'url', dir: 'ltr' },
    { key: 'privacy_url', label: 'رابط سياسة الخصوصية', type: 'url', dir: 'ltr' },
  ]

  return (
    <div className="space-y-6">
      {/* معلومات المنصة */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">معلومات المنصة</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{f.label}</label>
              <input
                type={f.type}
                dir={f.dir}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ))}
        </div>
      </div>

      {/* وضع الصيانة */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">وضع الصيانة</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              عند التفعيل يتوقف الوصول لجميع صفحات المنصة
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.maintenance_mode}
            onClick={() => set('maintenance_mode', !form.maintenance_mode)}
            className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
              form.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.maintenance_mode ? 'translate-x-1' : 'translate-x-7'
              }`}
            />
          </button>
        </div>
        {form.maintenance_mode && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            ⚠️ المنصة في وضع الصيانة — المستخدمون لا يستطيعون الوصول بعد الحفظ
          </div>
        )}
      </div>

      {/* حفظ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs">
          {error && <span className="text-red-600">{error}</span>}
          {saved && <span className="text-emerald-600">✓ تم الحفظ بنجاح</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            dirty && !saving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  )
}
