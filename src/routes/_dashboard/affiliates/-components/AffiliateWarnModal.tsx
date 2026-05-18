// src/routes/_dashboard/affiliates/-components/AffiliateWarnModal.tsx
import { useState } from 'react'
import type { Affiliate } from '../-affiliates.types'

interface Props {
  affiliate: Affiliate
  loading:   boolean
  onClose:   () => void
  onSend:    (message: string) => void
}

export function AffiliateWarnModal({ affiliate, loading, onClose, onSend }: Props) {
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')

  function handleSend() {
    if (!message.trim()) { setError('نص الإنذار مطلوب'); return }
    onSend(message.trim())
    setMessage('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">إرسال إنذار</p>
              <p className="text-xs text-slate-400">{affiliate.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              نص الإنذار
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError('') }}
              placeholder="اكتب سبب الإنذار هنا..."
              disabled={loading}
              className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 resize-none transition-all disabled:opacity-50 disabled:bg-slate-50 ${
                error
                  ? 'border-red-300 focus:ring-red-300/40 focus:border-red-400'
                  : 'border-slate-200 focus:ring-amber-400/30 focus:border-amber-400'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-200 disabled:opacity-50 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                جاري الإرسال...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                إرسال الإنذار
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}