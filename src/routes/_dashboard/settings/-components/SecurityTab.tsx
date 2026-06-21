'use client'

import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import type { SecuritySettings } from '../-settings.types'

interface Props {
  data: SecuritySettings
}

export function SecurityTab({ data }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // change password
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // sessions
  const [revoking, setRevoking] = useState(false)
  const [revokeMsg, setRevokeMsg] = useState<string | null>(null)

  async function handleChangePassword() {
    setPwMsg(null)
    if (pwNew.length < 8)
      return setPwMsg({ ok: false, text: 'كلمة المرور الجديدة 8 أحرف على الأقل' })
    if (pwNew !== pwConfirm)
      return setPwMsg({ ok: false, text: 'كلمتا المرور غير متطابقتين' })

    setPwSaving(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword: pwCurrent,
        newPassword: pwNew,
        revokeOtherSessions: true,
      })
      if (error) {
        setPwMsg({ ok: false, text: 'كلمة المرور الحالية غير صحيحة' })
      } else {
        setPwMsg({ ok: true, text: '✓ تم تغيير كلمة المرور بنجاح' })
        setPwCurrent('')
        setPwNew('')
        setPwConfirm('')
      }
    } catch {
      setPwMsg({ ok: false, text: 'تعذّر تغيير كلمة المرور' })
    } finally {
      setPwSaving(false)
    }
  }

  async function handleRevokeOthers() {
    setRevoking(true)
    setRevokeMsg(null)
    try {
      const { error } = await authClient.revokeOtherSessions()
      setRevokeMsg(error ? 'تعذّر إنهاء الجلسات' : '✓ تم إنهاء جميع الجلسات الأخرى')
    } catch {
      setRevokeMsg('تعذّر إنهاء الجلسات')
    } finally {
      setRevoking(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await authClient.signOut()
      router.navigate({ to: '/login' })
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">الجلسات النشطة</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {data.active_sessions_count} جلسة
          </span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              💻
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">الجلسة الحالية</p>
              <p className="text-xs text-gray-400">هذا الجهاز</p>
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            نشطة
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            onClick={handleRevokeOthers}
            disabled={revoking}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
          >
            {revoking ? 'جارٍ الإنهاء...' : 'إنهاء جميع الجلسات الأخرى'}
          </button>
          {revokeMsg && <span className="text-xs text-emerald-600">{revokeMsg}</span>}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">تغيير كلمة المرور</h2>
        <p className="text-sm text-gray-500 mb-4">يُنصح بتغييرها كل 3 أشهر</p>
        <div className="space-y-3">
          {[
            { label: 'كلمة المرور الحالية', value: pwCurrent, set: setPwCurrent },
            { label: 'كلمة المرور الجديدة', value: pwNew, set: setPwNew },
            { label: 'تأكيد كلمة المرور', value: pwConfirm, set: setPwConfirm },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{f.label}</label>
              <input
                type="password"
                value={f.value}
                onChange={(e) => {
                  f.set(e.target.value)
                  setPwMsg(null)
                }}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {pwSaving ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
          </button>
          {pwMsg && (
            <span className={`text-xs ${pwMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
              {pwMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">تسجيل الخروج</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              سيتم إنهاء جلستك الحالية وإعادة توجيهك لصفحة تسجيل الدخول
            </p>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              تسجيل الخروج
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loggingOut ? 'جاري الخروج...' : 'تأكيد الخروج'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
