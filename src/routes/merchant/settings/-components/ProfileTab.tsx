import { useState } from 'react'
import type { ProfileData } from '../-settings.types'
import { updateProfile } from '../-server/settings.api'

interface Props {
  data: ProfileData
}

const WILAYAS = [
  'الجزائر العاصمة',
  'وهران',
  'قسنطينة',
  'عنابة',
  'سطيف',
  'باتنة',
  'بجاية',
  'تيزي وزو',
  'بلعباس',
  'تلمسان',
  'مستغانم',
  'بسكرة',
  'تبسة',
  'بومرداس',
  'تيبازة',
]

export default function ProfileTab({ data }: Props) {
  const [form, setForm] = useState<ProfileData>(data)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = (
    section: keyof ProfileData,
    field: string,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({
      data: {
        name: form.profile.fullName,
        phone: form.profile.phone,
        wilaya: form.pickup.wilaya,
        storeName: form.profile.storeName,
        address: form.pickup.address,
      },
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            المعلومات الأساسية
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            اسمك وبيانات التواصل الشخصية
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={form.profile.fullName}
              onChange={(e) => update('profile', 'fullName', e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={form.profile.email}
              onChange={(e) => update('profile', 'email', e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={form.profile.phone}
              onChange={(e) => update('profile', 'phone', e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              اسم المتجر / الشركة
            </label>
            <input
              type="text"
              value={form.profile.storeName}
              onChange={(e) => update('profile', 'storeName', e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Pickup Details */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            تفاصيل نقطة الاستلام
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            العنوان الذي سيأتي إليه عامل شركة التوصيل لاستلام الطرود
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-medium text-gray-600">الولاية</label>
            <select
              value={form.pickup.wilaya}
              onChange={(e) => update('pickup', 'wilaya', e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
            >
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-medium text-gray-600">
              العنوان التفصيلي
            </label>
            <textarea
              value={form.pickup.address}
              onChange={(e) => update('pickup', 'address', e.target.value)}
              rows={3}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
        {saved && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            تم الحفظ بنجاح
          </span>
        )}
      </div>
    </div>
  )
}