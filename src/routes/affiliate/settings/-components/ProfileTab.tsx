// ============================================================
// -components/ProfileTab.tsx
// ============================================================

import { useState } from 'react'
import { Link, ExternalLink } from 'lucide-react'
import { updateProfile } from '../-server/settings.api'
import type { AffiliateProfile, UpdateProfileForm } from '../-settings.types'

interface Props {
  profile: AffiliateProfile
}

function AvatarBlock({ profile }: { profile: AffiliateProfile }) {
  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="relative">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
            {initials}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{profile.fullName}</p>
        <p className="text-xs text-gray-400">@{profile.username}</p>
      </div>
    </div>
  )
}

export function ProfileTab({ profile }: Props) {
  const [form, setForm] = useState<UpdateProfileForm>({
    fullName: profile.fullName,
    username: profile.username,
    phone: profile.phone,
    socialLinks: profile.socialLinks,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChange(field: keyof UpdateProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSocialChange(platform: keyof typeof form.socialLinks, value: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }))
  }

  async function handleSave() {
    setIsSaving(true)
    await updateProfile({ data: form })
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // النطاق من إعداد المنصة (لا نطاق ثابت)؛ والروابط الفعلية للبيع تُولَّد لكل
  // منتج من سوق المنتجات (كود/رابط التتبّع) — هذا رابط عام للمشاركة فقط.
  const appBase = (import.meta.env.VITE_APP_URL ?? '').replace(/\/+$/, '')
  const affiliateLink = `${appBase}/p/${form.username}`

  return (
    <div className="space-y-4">
      <AvatarBlock profile={profile} />

      {/* رابط الإحالة */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-xs font-medium text-gray-700">رابط الإحالة الخاص بك</p>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <Link size={13} className="shrink-0 text-gray-400" />
          <span className="flex-1 text-xs text-gray-500 truncate">{affiliateLink}</span>
          <button
            onClick={() => navigator.clipboard.writeText(affiliateLink)}
            className="shrink-0 rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
          >
            نسخ
          </button>
          <a href={affiliateLink} target="_blank" rel="noreferrer">
            <ExternalLink size={12} className="text-gray-400" />
          </a>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          للبيع الفعلي، ولّد رابطاً أو كوداً لكل منتج من «سوق المنتجات».
        </p>
      </div>

      {/* المعلومات الأساسية */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-medium text-gray-700">المعلومات الأساسية</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">الاسم الكامل</label>
            <input
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">رمز الإحالة</label>
            <div className="flex items-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
              <span className="bg-gray-100 px-2 py-2 text-xs text-gray-400 border-l border-gray-200">@</span>
              <input
                value={form.username}
                disabled
                className="flex-1 bg-gray-50 px-2 py-2 text-xs text-gray-400 outline-none cursor-not-allowed"
              />
            </div>
            <p className="mt-0.5 text-xs text-gray-400">يُولّده النظام ولا يمكن تغييره</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">البريد الإلكتروني</label>
            <input
              value={profile.email}
              disabled
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-400 cursor-not-allowed"
            />
            <p className="mt-0.5 text-xs text-gray-400">يُعدَّل عبر الدعم الفني</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">رقم الهاتف</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0555 xxx xxx"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* السوشيال ميديا */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-0.5 text-xs font-medium text-gray-700">روابط السوشيال ميديا</p>
        <p className="mb-3 text-xs text-gray-400">اختياري — تساعد التاجر على معرفة مصادر زياراتك</p>
        <div className="space-y-2.5">
          {[
            { key: 'tiktok' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@حسابك' },
            { key: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/حسابك' },
            { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/حسابك' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-gray-500">{label}</span>
              <input
                value={form.socialLinks[key] || ''}
                onChange={(e) => handleSocialChange(key, e.target.value)}
                placeholder={placeholder}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-start">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`rounded-lg px-5 py-2 text-xs font-medium transition-colors ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          } disabled:opacity-60`}
        >
          {isSaving ? 'جارٍ الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  )
}