// src/routes/_dashboard/-shared/-components/JoinRequestsSection.tsx
import { useState } from 'react'
import type { JoinRequest } from '../-shared.types'

interface RequestModalProps {
  request: JoinRequest
  onClose: () => void
  onAccept: (id: string) => void
  onReject: (id: string, note: string) => void
}

function RequestModal({ request, onClose, onAccept, onReject }: RequestModalProps) {
  const [rejectNote, setRejectNote] = useState('')
  const [step, setStep] = useState<'view' | 'reject'>('view')

  const baseFields = [
    { label: 'البريد الإلكتروني', value: request.email },
    { label: 'رقم الهاتف',        value: request.phone },
    { label: 'الولاية',           value: request.wilaya },
    { label: 'الفئة',             value: request.category },
    { label: 'تاريخ الطلب',      value: request.requestedAt },
  ]

  const allFields = [...baseFields, ...(request.extraFields ?? [])]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* header */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600 text-sm shrink-0">
              {request.name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{request.businessName}</p>
              <p className="text-xs text-slate-400 truncate">{request.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* حقول الطلب — أساسية + إضافية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allFields.map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-xs font-semibold text-slate-700 break-words">{value}</p>
              </div>
            ))}
          </div>

          {step === 'reject' && (
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">سبب الرفض (اختياري)</p>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-300/40 focus:border-red-400 h-24"
                placeholder="أدخل سبب الرفض لإعلام مقدم الطلب..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-2 shrink-0">
          {step === 'view' ? (
            <>
              <button
                onClick={() => { onAccept(request.id); onClose() }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                قبول الطلب
              </button>
              <button
                onClick={() => setStep('reject')}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl py-2.5 text-sm transition-colors border border-red-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                رفض الطلب
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { onReject(request.id, rejectNote); onClose() }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-2.5 text-sm transition-colors"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => setStep('view')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
              >
                رجوع
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 5

interface Props {
  requests: JoinRequest[]
  onAccept: (id: string) => void
  onReject: (id: string, note: string) => void
}

export function JoinRequestsSection({ requests, onAccept, onReject }: Props) {
  const [selected, setSelected] = useState<JoinRequest | null>(null)
  const [page, setPage] = useState(1)

  const totalPages  = Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems   = requests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (requests.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">طلبات الانضمام</p>
            <p className="text-xs text-slate-400 truncate">
              عرض {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, requests.length)} من {requests.length} طلب
            </p>
          </div>
        </div>
        <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
          {requests.length} طلب
        </span>
      </div>

      {/* rows */}
      <div className="divide-y divide-slate-50">
        {pageItems.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50/70 transition-colors group sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center gap-3 min-w-0 sm:flex-1">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600 text-sm shrink-0">
                {r.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{r.businessName}</p>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">{r.category}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{r.name} · {r.wilaya} · {r.email}</p>
              </div>
            </div>
            <div className="text-left shrink-0 hidden md:block">
              <p className="text-xs text-slate-400 whitespace-nowrap">{r.requestedAt}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 ps-12 sm:ps-0">
              <button
                onClick={() => setSelected(r)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                تفاصيل
              </button>
              <button
                onClick={() => onAccept(r.id)}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
              >
                قبول
              </button>
              <button
                onClick={() => onReject(r.id, '')}
                className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200"
              >
                رفض
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            التالي
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  p === currentPage ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            السابق
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      )}

      {selected && (
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}
    </div>
  )
}