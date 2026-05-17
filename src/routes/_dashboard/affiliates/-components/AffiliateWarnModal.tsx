// src/routes/_dashboard/affiliates/-components/AffiliateWarnModal.tsx
import { useState } from 'react'
import type { Affiliate } from '../-affiliates.types'

interface Props {
  affiliate: Affiliate
  onClose: () => void
  onSend: (message: string) => void
}

export function AffiliateWarnModal({ affiliate, onClose, onSend }: Props) {
  const [msg, setMsg] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">إرسال إنذار</p>
            <p className="text-xs text-slate-400">{affiliate.name}</p>
          </div>
        </div>

        <textarea
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 h-28"
          placeholder="اكتب نص الإنذار هنا..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { if (msg.trim()) { onSend(msg); onClose() } }}
            disabled={!msg.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
          >
            إرسال الإنذار
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}