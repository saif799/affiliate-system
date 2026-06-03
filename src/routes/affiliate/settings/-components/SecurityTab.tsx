// ============================================================
// -components/SecurityTab.tsx
// ============================================================

import { useState } from 'react'
import { Monitor, Smartphone, Eye, EyeOff, Copy, LogOut, Shield } from 'lucide-react'
import { changePassword, revokeAllSessions } from '../-server/settings.api'
import type { SecuritySettings, ChangePasswordForm } from '../-settings.types'

interface Props {
  security: SecuritySettings
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${Math.floor(hours / 24)} يوم`
}

function DeviceIcon({ device }: { device: string }) {
  const isMobile =
    device.toLowerCase().includes('هاتف') ||
    device.toLowerCase().includes('iphone') ||
    device.toLowerCase().includes('android')
  return isMobile ? (
    <Smartphone size={15} className="text-gray-500" />
  ) : (
    <Monitor size={15} className="text-gray-500" />
  )
}

export function SecurityTab({ security }: Props) {
  const [sessions, setSessions] = useState(security.sessions)
  const [form, setForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)

  function handleField(field: keyof ChangePasswordForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setPasswordError('')
  }

  function toggleShow(field: keyof typeof showPasswords) {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  async function handleChangePassword() {
    if (form.newPassword !== form.confirmPassword) {
      setPasswordError('كلمتا المرور الجديدة غير متطابقتين')
      return
    }
    if (form.newPassword.length < 8) {
      setPasswordError('يجب أن تكون كلمة المرور 8 أحرف على الأقل')
      return
    }
    setIsSaving(true)
    const result = await changePassword({ data: form })
    setIsSaving(false)
    if (!result.success) {
      setPasswordError(result.error || 'حدث خطأ ما')
    } else {
      setPasswordSaved(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSaved(false), 3000)
    }
  }

  async function handleRevokeAll() {
    setIsRevoking(true)
    await revokeAllSessions()
    setSessions((prev) => prev.filter((s) => s.isCurrent))
    setIsRevoking(false)
  }

  function copyReferral() {
    navigator.clipboard.writeText(security.referralCode)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 2000)
  }

  const passwordFields = [
    { key: 'currentPassword' as const, label: 'كلمة المرور الحالية', show: showPasswords.current, toggle: () => toggleShow('current') },
    { key: 'newPassword' as const, label: 'كلمة المرور الجديدة', show: showPasswords.new, toggle: () => toggleShow('new') },
    { key: 'confirmPassword' as const, label: 'تأكيد كلمة المرور', show: showPasswords.confirm, toggle: () => toggleShow('confirm') },
  ]

  return (
    <div className="space-y-4">
      {/* تغيير كلمة المرور */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-medium text-gray-700">تغيير كلمة المرور</p>
        <div className="space-y-2.5">
          {passwordFields.map(({ key, label, show, toggle }) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-gray-500">{label}</label>
              <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 focus-within:border-gray-400">
                <input
                  type={show ? 'text' : 'password'}
                  value={form[key]}
                  onChange={(e) => handleField(key, e.target.value)}
                  className="flex-1 px-3 py-2 text-xs outline-none"
                  placeholder="••••••••"
                />
                <button
                  onClick={toggle}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        {passwordError && (
          <p className="mt-2 text-xs text-red-500">{passwordError}</p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={isSaving || !form.currentPassword || !form.newPassword}
          className={`mt-3 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            passwordSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          } disabled:opacity-50`}
        >
          {isSaving ? 'جارٍ التحديث...' : passwordSaved ? '✓ تم التحديث' : 'تحديث كلمة المرور'}
        </button>
      </div>

      {/* الأجهزة المتصلة */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-xs font-medium text-gray-700">
            الأجهزة المتصلة ({sessions.length})
          </p>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              disabled={isRevoking}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              <LogOut size={12} />
              {isRevoking ? 'جارٍ...' : 'تسجيل الخروج من كل الأجهزة'}
            </button>
          )}
        </div>

        {sessions.map((session, i) => (
          <div
            key={session.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              i < sessions.length - 1 ? 'border-b border-gray-50' : ''
            } ${session.isCurrent ? 'bg-gray-50/60' : ''}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <DeviceIcon device={session.device} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-gray-900">{session.device}</p>
                {session.isCurrent && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    الجهاز الحالي
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {session.location} · {session.ip} · {timeAgo(session.lastActive)}
              </p>
            </div>
          </div>
        ))}

        {sessions.length === 1 && sessions[0].isCurrent && (
          <div className="px-4 py-3 text-center text-xs text-gray-400">
            لا توجد أجهزة أخرى متصلة
          </div>
        )}
      </div>

      {/* رمز الإحالة */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-gray-500" />
          <p className="text-xs font-medium text-gray-700">رمز الإحالة</p>
        </div>
        <p className="mb-2.5 text-xs text-gray-400">
          شارك هذا الرمز مع مسوقين آخرين لينضموا للمنصة
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <span className="flex-1 font-mono text-sm font-bold text-gray-800">
            {security.referralCode}
          </span>
          <button
            onClick={copyReferral}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
          >
            <Copy size={11} />
            {referralCopied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>
      </div>
    </div>
  )
}