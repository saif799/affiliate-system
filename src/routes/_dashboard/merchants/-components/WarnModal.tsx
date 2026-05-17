// src/routes/_dashboard/merchants/-components/WarnModal.tsx
import { useState } from 'react'
import type { Merchant } from '../-merchants.types'

interface Props {
  merchant: Merchant
  loading:  boolean
  onClose:  () => void
  onSend:   (message: string) => void
}

export function WarnModal({ merchant, loading, onClose, onSend }: Props) {
  const [msg, setMsg] = useState('')

  function handleSend() {
    if (!msg.trim() || loading) return
    onSend(msg)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">إرسال إنذار</p>
            <p className="text-xs text-slate-400">{merchant.businessName}</p>
          </div>
        </div>

        <textarea
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 h-28"
          placeholder="اكتب نص الإنذار هنا..."
          value={msg}
          onChange={e => setMsg(e.target.value)}
          disabled={loading}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSend}
            disabled={!msg.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                جاري الإرسال...
              </>
            ) : (
              'إرسال الإنذار'
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