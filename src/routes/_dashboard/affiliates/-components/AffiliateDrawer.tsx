// src/routes/_dashboard/affiliates/-components/AffiliateDrawer.tsx
import { useState } from 'react'
import type { Affiliate, AffiliateStatus } from '../-affiliates.types'
import { WarningThreadModal } from '#/routes/-components/shared/WarningThreadModal'

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
  affiliate:      Affiliate
  loading:        boolean
  onClose:        () => void
  onStatusChange: (id: string, status: AffiliateStatus) => void
  onWarn:         (a: Affiliate) => void
  onDelete:       (id: string) => void
}

export function AffiliateDrawer({ affiliate, loading, onClose, onStatusChange, onWarn, onDelete }: Props) {
  const [tab,        setTab]        = useState<'overview' | 'warnings'>('overview')
  const [confirmDel, setConfirmDel] = useState(false)
  const [openWarningId, setOpenWarningId] = useState<string | null>(null)

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
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
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
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                تعليق
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(affiliate.id, 'active')}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
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
                  { label: 'كود الإحالة',        value: affiliate.referralCode },
                  { label: 'نسبة الرفض',         value: `${affiliate.refusalRate}%` },
                  { label: 'إجمالي الحملات',    value: String(affiliate.totalCampaigns) },
                  { label: 'إجمالي الطلبات',    value: String(affiliate.totalOrders) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* fraud flag badge */}
              {affiliate.fraudFlag && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p className="text-xs text-red-700 font-semibold">هذا المسوق مشار إليه بعلامة احتيال</p>
                </div>
              )}

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

              {/* delete */}
              <div className="pt-2 border-t border-slate-100">
                {!confirmDel ? (
                  <button
                    onClick={() => setConfirmDel(true)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 py-2.5 rounded-xl transition-colors disabled:opacity-40"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                    حذف المسوق
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-red-700 font-semibold text-center">هل أنت متأكد من حذف هذا المسوق؟</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onDelete(affiliate.id); setConfirmDel(false) }}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? 'جاري الحذف...' : 'نعم، احذف'}
                      </button>
                      <button
                        onClick={() => setConfirmDel(false)}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'warnings' && (
            <div className="space-y-3">
              {affiliate.warnings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">لا توجد إنذارات</div>
              ) : affiliate.warnings.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setOpenWarningId(w.id)}
                  className="w-full text-right bg-amber-50 border border-amber-100 rounded-xl p-4 transition-colors hover:bg-amber-100/60"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-amber-900 leading-relaxed">{w.message}</p>
                      <p className="text-xs text-amber-500 mt-1.5 font-medium">عرض المحادثة والرد ←</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {openWarningId && (
        <WarningThreadModal
          warningId={openWarningId}
          onClose={() => setOpenWarningId(null)}
        />
      )}
    </div>
  )
}