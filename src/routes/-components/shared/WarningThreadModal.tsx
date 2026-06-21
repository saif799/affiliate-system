'use client'

// ============================================================
// نافذة محادثة تنبيه الإدارة (إنذار) — مشتركة بين المستخدم (تاجر/مسوّق)
// والأدمن. تعرض التنبيه الأصلي + الردود + حقل رد. الخادم يحدّد دور الكاتب.
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { X, Send, AlertTriangle } from 'lucide-react'
import { getWarningThread, replyToWarning } from '#/server/warnings.api'
import type { WarningThread } from '#/server/warnings.api'

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function roleLabel(role: string): string {
  return role === 'super_admin'
    ? 'الإدارة'
    : role === 'merchant'
      ? 'التاجر'
      : role === 'affiliate'
        ? 'المسوّق'
        : role
}

export function WarningThreadModal({
  warningId,
  onClose,
  onChanged,
}: {
  warningId: string
  onClose: () => void
  onChanged?: () => void
}) {
  const [thread, setThread] = useState<WarningThread | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const t = await getWarningThread({ data: { warningId } })
      setThread(t)
    } catch {
      setThread(null)
    } finally {
      setLoading(false)
    }
  }, [warningId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await replyToWarning({ data: { warningId, body: text.trim() } })
      setText('')
      await load()
      onChanged?.()
    } catch {
      /* تجاهل — يبقى النصّ ليُعيد المحاولة */
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle size={16} />
            </span>
            <h2 className="text-sm font-bold text-gray-900">محادثة التنبيه</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-300" />
            </div>
          ) : !thread ? (
            <p className="py-10 text-center text-sm text-gray-400">
              تعذّر تحميل المحادثة
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* التنبيه الأصلي من الإدارة */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700">
                    ⚠️ تنبيه من الإدارة
                  </span>
                  <span className="text-[10px] text-amber-600">
                    {fmt(thread.sentAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {thread.message}
                </p>
              </div>

              {/* الردود */}
              {thread.replies.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl px-4 py-2.5 ${
                    r.authorRole === 'super_admin'
                      ? 'border border-amber-100 bg-amber-50/50'
                      : r.isMine
                        ? 'bg-violet-50'
                        : 'bg-gray-50'
                  }`}
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-gray-700">
                      <span className="truncate">{r.authorName}</span>
                      <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-normal text-gray-400">
                        {roleLabel(r.authorRole)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {fmt(r.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {r.body}
                  </p>
                </div>
              ))}

              {thread.replies.length === 0 && (
                <p className="text-center text-xs text-gray-400">
                  لا توجد ردود بعد — اكتب ردّك أدناه.
                </p>
              )}
            </div>
          )}
        </div>

        {/* composer */}
        <div className="flex items-end gap-2 border-t border-gray-100 p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="اكتب ردّك..."
            className="min-w-0 flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40"
            aria-label="إرسال الرد"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
