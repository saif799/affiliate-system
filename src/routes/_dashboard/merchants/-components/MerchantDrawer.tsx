// src/routes/_dashboard/merchants/-components/MerchantDrawer.tsx
import { useState } from 'react'
import type { Merchant, MerchantStatus } from '../-merchants.types'
import { WarningThreadModal } from '#/routes/-components/shared/WarningThreadModal'
import { fmt, statusLabel, statusColor } from '../-utils/format'

interface Props {
  merchant:       Merchant
  loading:        boolean
  onClose:        () => void
  onStatusChange: (id: string, status: MerchantStatus) => void
  onWarn:         (m: Merchant) => void
  onDelete:       (id: string) => void
}

export function MerchantDrawer({
  merchant,
  loading,
  onClose,
  onStatusChange,
  onWarn,
  onDelete,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'products' | 'warnings'>('overview')
  const [openWarningId, setOpenWarningId] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-40 flex" dir="rtl">
      <div className="flex-1 bg-black/25 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-[90vw] sm:max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
              {merchant.name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm leading-tight truncate">{merchant.businessName}</p>
              <p className="text-xs text-slate-400 truncate">{merchant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* status + actions */}
        <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColor(merchant.status)}`}>
            {statusLabel(merchant.status)}
          </span>

          <div className="flex flex-wrap gap-2">
            {/* إنذار */}
            <button
              onClick={() => onWarn(merchant)}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              إنذار
            </button>

            {/* تعليق / تفعيل */}
            {merchant.status !== 'suspended' ? (
              <button
                onClick={() => onStatusChange(merchant.id, 'suspended')}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                {loading ? '...' : 'تعليق'}
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(merchant.id, 'active')}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {loading ? '...' : 'تفعيل'}
              </button>
            )}

            {/* حذف */}
            <button
              onClick={() => onDelete(merchant.id)}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
              title="حذف التاجر"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              حذف
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="px-4 sm:px-6 pb-0">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['overview', 'products', 'warnings'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  tab === t
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'overview'
                  ? 'نظرة عامة'
                  : t === 'products'
                  ? `المنتجات (${merchant.totalProducts})`
                  : `الإنذارات (${merchant.warnings.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div className="px-4 sm:px-6 py-4 flex-1">

          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'البريد الإلكتروني', value: merchant.email },
                  { label: 'رقم الهاتف',        value: merchant.phone },
                  { label: 'الولاية',            value: merchant.wilaya },
                  { label: 'تاريخ الانضمام',    value: merchant.joinedAt },
                  { label: 'نسبة العمولة',       value: `${merchant.commissionRate}%` },
                  { label: 'إجمالي المنتجات',   value: merchant.totalProducts },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <p className="text-xs text-indigo-500 font-semibold mb-3">إحصائيات المبيعات</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">إجمالي الطلبات</p>
                    <p className="text-xl font-bold text-slate-800">{fmt(merchant.totalOrders)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">إجمالي الإيرادات</p>
                    <p className="text-xl font-bold text-indigo-700">
                      {fmt(merchant.totalRevenue)}{' '}
                      <span className="text-sm font-normal text-slate-400">DZD</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="space-y-2">
              {merchant.products.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">لا توجد منتجات بعد</div>
              ) : (
                merchant.products.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.category}</p>
                    </div>
                    <div className="text-left shrink-0 ms-3">
                      <p className="text-sm font-bold text-slate-800">{fmt(p.price)} DZD</p>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <p className="text-[11px] text-slate-400">
                          {p.stock > 0 ? `${p.stock} في المخزن` : 'نفد المخزون'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'warnings' && (
            <div className="space-y-3">
              {merchant.warnings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">لا توجد إنذارات</div>
              ) : (
                merchant.warnings.map(w => (
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
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-amber-900 leading-relaxed">{w.message}</p>
                        <p className="text-xs text-amber-500 mt-1.5 font-medium">عرض المحادثة والرد ←</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
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