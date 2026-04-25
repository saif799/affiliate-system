import { useState } from 'react'
import type { ActiveSession, SessionDevice } from '../settings.types'
import {
  updatePassword,
  terminateSession,
  terminateAllSessions,
  requestAccountDeletion,
} from '../-server/settings.api'

interface Props {
  sessions: ActiveSession[]
}

const DEVICE_ICONS: Record<SessionDevice, string> = {
  desktop: '💻',
  mobile: '📱',
  tablet: '📟',
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordStrength = (pw: string) => {
    if (!pw) return null
    if (pw.length < 8) return { level: 'weak', label: 'ضعيفة', color: 'bg-red-400' }
    if (pw.length < 12 || !/\d/.test(pw)) return { level: 'medium', label: 'متوسطة', color: 'bg-yellow-400' }
    return { level: 'strong', label: 'قوية', color: 'bg-green-500' }
  }

  const strength = passwordStrength(next)

  const handleSave = async () => {
    setError('')
    if (!current || !next || !confirm) {
      setError('يرجى ملء جميع الحقول')
      return
    }
    if (next !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (next.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    setSaving(true)
    const result = await updatePassword({
      data: { currentPassword: current, newPassword: next },
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'فشل تحديث كلمة المرور')
      return
    }
    setSuccess(true)
    setCurrent('')
    setNext('')
    setConfirm('')
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <section>
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">تغيير كلمة المرور</h2>
      </div>

      <div className="max-w-sm space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">
            كلمة المرور الحالية
          </label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">
            كلمة المرور الجديدة
          </label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="8 أحرف على الأقل"
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
          />
          {strength && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {['weak', 'medium', 'strong'].map((level, i) => (
                  <div
                    key={level}
                    className={`h-1 w-10 rounded-full transition-colors ${
                      i <= ['weak', 'medium', 'strong'].indexOf(strength.level)
                        ? strength.color
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500">{strength.label}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">
            تأكيد كلمة المرور
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            className={`h-9 rounded-lg border px-3 text-xs outline-none transition-colors ${
              confirm && confirm !== next
                ? 'border-red-300 focus:border-red-400'
                : 'border-gray-200 focus:border-gray-400'
            } bg-white`}
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
          {success && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              تم التحديث بنجاح
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

function SessionsSection({ sessions }: { sessions: ActiveSession[] }) {
  const [list, setList] = useState(sessions)
  const [terminating, setTerminating] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  const handleTerminate = async (id: string) => {
    setTerminating(id)
    await terminateSession({ data: { sessionId: id } })
    setList((prev) => prev.filter((s) => s.id !== id))
    setTerminating(null)
  }

  const handleTerminateAll = async () => {
    setTerminatingAll(true)
    await terminateAllSessions()
    setList((prev) => prev.filter((s) => s.isCurrent))
    setTerminatingAll(false)
  }

  return (
    <section>
      <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            الأجهزة المتصلة
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {list.length} جلسة نشطة حالياً
          </p>
        </div>
        {list.some((s) => !s.isCurrent) && (
          <button
            onClick={handleTerminateAll}
            disabled={terminatingAll}
            className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {terminatingAll ? 'جاري...' : 'إنهاء كل الجلسات الأخرى'}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {list.map((session, i) => (
          <div
            key={session.id}
            className={`flex items-center justify-between px-4 py-3.5 ${
              i < list.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                {DEVICE_ICONS[session.device]}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-gray-900">
                    {session.browser} — {session.location}
                  </p>
                  {session.isCurrent && (
                    <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                      الجهاز الحالي
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5" dir="ltr">
                  آخر نشاط: {session.lastActive} · {session.ip}
                </p>
              </div>
            </div>

            {!session.isCurrent && (
              <button
                onClick={() => handleTerminate(session.id)}
                disabled={terminating === session.id}
                className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {terminating === session.id ? '...' : 'إنهاء الجلسة'}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRequest = async () => {
    setSending(true)
    await requestAccountDeletion()
    setSending(false)
    setSent(true)
    setConfirming(false)
  }

  return (
    <section>
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-xs font-semibold text-red-800 mb-1">
          منطقة الخطر
        </h3>
        <p className="text-xs text-red-600 mb-3">
          حذف الحساب إجراء لا رجعة فيه — سيتم حذف جميع بياناتك ومنتجاتك
          وسجل المعاملات نهائياً.
        </p>

        {sent ? (
          <p className="text-xs text-red-700 font-medium">
            تم إرسال طلب الحذف. سيتواصل معك الفريق خلال 48 ساعة.
          </p>
        ) : confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-700">هل أنت متأكد تماماً؟</span>
            <button
              onClick={handleRequest}
              disabled={sending}
              className="text-xs text-white bg-red-600 rounded-lg px-3 py-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'جاري الإرسال...' : 'نعم، أريد الحذف'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-red-700 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors"
          >
            طلب حذف الحساب
          </button>
        )}
      </div>
    </section>
  )
}

export default function SecurityTab({ sessions }: Props) {
  return (
    <div className="space-y-8">
      <PasswordSection />
      <SessionsSection sessions={sessions} />
      <DangerZone />
    </div>
  )
}