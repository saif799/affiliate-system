// src/routes/_dashboard/affiliates/-components/AffiliateDrawer.tsx
import { useState } from 'react'
import type { Affiliate, AffiliateStatus } from '../-affiliates.types'

function fmt(n: number) {
  return new Intl.NumberFormat('ar-DZ').format(n)
}

function statusLabel(s: AffiliateStatus) {
  return s === 'active' ? 'نشط' : s === 'suspended' ? 'موقوف' : 'قيد الانتظار'
}

function statusColor(s: AffiliateStatus) {
  return s === 'active'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : s === 'suspended'
    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
}

interface Props {
  affiliate: Affiliate
  onClose: () => void
  onStatusChange: (id: string, status: AffiliateStatus) => void
  onWarn: (a: Affiliate) => void
}

export function AffiliateDrawer({ affiliate, onClose, onStatusChange, onWarn }: Props) {
  const [tab, setTab] = useState<'overview' | 'warnings'>('overview')

  return (
    <div className="fixed inset-0 z-40 flex" dir="rtl">
      <div className="flex-1 bg-black/25 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600">
              {affiliate.name[0]}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{affiliate.name}</p>
              <p className="text-xs text-slate-400">{affiliate.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* status + actions */}
        <div className="px-6 pt-4 pb-3 flex items-center justify-between">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor(affiliate.status)}`}>
            {statusLabel(affiliate.status)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onWarn(affiliate)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              إنذار
            </button>
            {affiliate.status !== 'suspended' ? (
              <button
                onClick={() => onStatusChange(affiliate.id, 'suspended')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                تعليق
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(affiliate.id, 'active')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                تفعيل
              </button>
            )}
          </div>
        </div>

        {/* tabs */}
        <div className="px-6 pb-0">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['overview', 'warnings'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'overview' ? 'نظرة عامة' : `الإنذارات (${affiliate.warnings.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div className="px-6 py-4 flex-1">

          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'البريد الإلكتروني', value: affiliate.email },
                  { label: 'رقم الهاتف',        value: affiliate.phone },
                  { label: 'الولاية',            value: affiliate.wilaya },
                  { label: 'تاريخ الانضمام',    value: affiliate.joinedAt },
                  { label: 'إجمالي الحملات',    value: affiliate.totalCampaigns },
                  { label: 'إجمالي الطلبات',    value: affiliate.totalOrders },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                <p className="text-xs text-violet-500 font-semibold mb-3">إحصائيات العمولات</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">إجمالي العمولات</p>
                    <p className="text-xl font-bold text-slate-800">{fmt(affiliate.totalCommissions)}</p>
                    <p className="text-xs text-slate-400">DZD</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">عمولات معلقة</p>
                    <p className="text-xl font-bold text-violet-700">{fmt(affiliate.pendingCommissions)}</p>
                    <p className="text-xs text-slate-400">DZD</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'warnings' && (
            <div className="space-y-3">
              {affiliate.warnings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">لا توجد إنذارات</div>
              ) : affiliate.warnings.map(w => (
                <div key={w.id} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm text-amber-900 leading-relaxed">{w.message}</p>
                      <p className="text-xs text-amber-400 mt-1">{w.sentAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}