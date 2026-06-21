// -components/PayoutTable.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import type {
  WithdrawalRequest,
  WithdrawalStatus,
  EarningSourceItem,
} from '../-commissions.types'
import {
  confirmWithdrawal,
  rejectWithdrawal,
  approveWithdrawal,
  getWithdrawalSource,
} from '../-server/commissions.api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; class: string }> = {
  pending:  { label: 'قيد الانتظار', class: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'قيد التحقق',   class: 'bg-blue-100 text-blue-700'   },
  rejected: { label: 'مرفوض',        class: 'bg-red-100 text-red-700'     },
  paid:     { label: 'مُسدَّد',      class: 'bg-green-100 text-green-700' },
}

const FILTER_TABS: { label: string; value: WithdrawalStatus | 'all' }[] = [
  { label: 'الكل',          value: 'all'      },
  { label: 'قيد الانتظار', value: 'pending'  },
  { label: 'قيد التحقق',   value: 'approved' },
  { label: 'مُسدَّد',      value: 'paid'     },
  { label: 'مرفوض',        value: 'rejected' },
]

// ============================================================
// CONFIRM MODAL
// ============================================================

function ConfirmModal({
  request,
  onClose,
  onConfirmed,
}: {
  request: WithdrawalRequest
  onClose: () => void
  onConfirmed: () => void
}) {
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (ref.trim().length < 4) {
      setError('أدخل رقم الإثبات (4 أحرف على الأقل)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await confirmWithdrawal({ data: { withdrawalId: request.id, transactionRef: ref.trim() } })
      onConfirmed()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full max-w-md mx-4 p-6 text-right">
        <h2 className="text-base font-semibold text-gray-900 mb-1">تأكيد الدفع</h2>
        <p className="text-sm text-gray-500 mb-5">
          أدخل رقم الإثبات الصادر من {request.method} بعد إتمام التحويل
        </p>

        {/* ملخص الطلب */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5">
          {[
            { label: 'المستفيد',     val: request.userName    },
            { label: 'المبلغ',       val: `${request.amount.toLocaleString('ar-DZ')} دج` },
            { label: 'وسيلة الدفع', val: request.method      },
            { label: 'رقم الحساب',  val: request.accountNumber },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="font-medium text-gray-800">{val}</span>
            </div>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          رقم الإثبات (Numéro de transaction)
        </label>
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="مثال: 20250116123456"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
          dir="ltr"
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || ref.trim().length < 4}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors disabled:opacity-40"
          >
            {loading ? 'جارٍ الحفظ...' : 'تأكيد التحويل'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SOURCE MODAL — كيف ربح المستخدم هذا الرصيد
// ============================================================

function SourceModal({
  request,
  onClose,
}: {
  request: WithdrawalRequest
  onClose: () => void
}) {
  const [items, setItems] = useState<EarningSourceItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getWithdrawalSource({ data: { withdrawalId: request.id } })
      .then((res) => active && setItems(res))
      .catch((e) =>
        active && setError(e instanceof Error ? e.message : 'فشل تحميل المصدر'),
      )
    return () => {
      active = false
    }
  }, [request.id])

  const total = (items ?? []).reduce((s, i) => s + i.amount, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full max-w-lg mx-4 p-6 text-right">
        <h2 className="text-base font-semibold text-gray-900 mb-1">مصدر أرباح {request.userName}</h2>
        <p className="text-sm text-gray-500 mb-4">
          المنتجات/الطلبيات التي تكوّن منها رصيد هذا المستخدم
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {!items && !error && <p className="text-sm text-gray-400">جارٍ التحميل...</p>}

        {items && items.length === 0 && (
          <p className="text-sm text-gray-400">لا توجد أرباح مسجّلة بعد.</p>
        )}

        {items && items.length > 0 && (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-100">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['المنتج', 'الولاية', 'المبلغ', 'الحالة', 'التاريخ'].map((h) => (
                    <th key={h} className="text-right text-gray-500 font-medium px-3 py-2 text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2 text-gray-800">{i.productName}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{i.wilaya ?? '—'}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {i.amount.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          i.status === 'released'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {i.status === 'released' ? 'مُحرَّر' : 'قيد الحجز'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs">
                      {new Date(i.date).toLocaleDateString('ar-DZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="flex justify-between items-center mt-3 text-sm">
            <span className="text-gray-500">إجمالي الأرباح المسجّلة</span>
            <span className="font-semibold text-gray-900">{total.toLocaleString('ar-DZ')} دج</span>
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN TABLE
// ============================================================

export function PayoutTable({ requests }: { requests: WithdrawalRequest[] }) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | 'CCP' | 'BaridiMob'>('all')
  const [wilayaFilter, setWilayaFilter] = useState('all')
  const [confirmTarget, setConfirmTarget] = useState<WithdrawalRequest | null>(null)
  const [sourceTarget, setSourceTarget] = useState<WithdrawalRequest | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const wilayas = Array.from(
    new Set(requests.map((r) => r.userWilaya ?? '').filter(Boolean)),
  )

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (methodFilter !== 'all' && r.method !== methodFilter) return false
    if (wilayaFilter !== 'all' && r.userWilaya !== wilayaFilter) return false
    return true
  })

  const pendingCount = requests.filter(
    (r) => r.status === 'pending' || r.status === 'approved',
  ).length

  async function handleReject(id: string) {
    setRejectingId(id)
    try {
      await rejectWithdrawal({ data: { withdrawalId: id } })
      router.invalidate()
    } finally {
      setRejectingId(null)
    }
  }

  async function handleApprove(id: string) {
    setApprovingId(id)
    try {
      await approveWithdrawal({ data: { withdrawalId: id } })
      router.invalidate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'فشل الموافقة')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <>
      {confirmTarget && (
        <ConfirmModal
          request={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirmed={() => { setConfirmTarget(null); router.invalidate() }}
        />
      )}

      {sourceTarget && (
        <SourceModal request={sourceTarget} onClose={() => setSourceTarget(null)} />
      )}

      <div className="space-y-3">
        {/* Filters — نفس نمط AffiliatesFilters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mr-auto">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
            >
              <option value="all">كل الوسائل</option>
              <option value="BaridiMob">BaridiMob</option>
              <option value="CCP">CCP</option>
            </select>
            <select
              value={wilayaFilter}
              onChange={(e) => setWilayaFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
            >
              <option value="all">كل الولايات</option>
              {wilayas.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {pendingCount > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
              {pendingCount} بانتظار المراجعة
            </span>
          )}
        </div>

        {/* Table — نفس نمط AffiliatesTable */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-400 text-sm">لا توجد طلبات مطابقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['المستفيد', 'المبلغ', 'الوسيلة', 'تاريخ الطلب', 'الحالة', 'إجراءات'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-right text-gray-500 font-medium px-5 py-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    {/* المستفيد */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        {r.fraudFlag && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium mt-0.5 shrink-0">
                            fraud
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{r.userName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {r.userWilaya ?? '—'} —{' '}
                            {r.userRole === 'merchant' ? 'تاجر' : 'مسوّق'}
                            {r.refusalRate !== null && (
                              <span
                                className={r.refusalRate >= 40 ? 'text-red-500 mr-1' : 'text-gray-400 mr-1'}
                              >
                                · رفض {Math.round(r.refusalRate)}%
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* المبلغ */}
                    <td className="px-5 py-4 font-medium text-gray-700">
                      {r.amount.toLocaleString('ar-DZ')} دج
                    </td>

                    {/* الوسيلة */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.method === 'BaridiMob'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {r.method}
                      </span>
                    </td>

                    {/* تاريخ */}
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {formatDate(r.requestedAt)}
                    </td>

                    {/* الحالة */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[r.status].class}`}
                      >
                        {STATUS_CONFIG[r.status].label}
                      </span>
                    </td>

                    {/* إجراءات */}
                    <td className="px-5 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {/* عرض المصدر متاح طالما الطلب قيد المعالجة */}
                        {(r.status === 'pending' || r.status === 'approved') && (
                          <button
                            onClick={() => setSourceTarget(r)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                          >
                            المصدر
                          </button>
                        )}

                        {/* pending → موافقة */}
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={approvingId === r.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors disabled:opacity-40"
                          >
                            {approvingId === r.id ? '...' : 'موافقة'}
                          </button>
                        )}

                        {/* approved → تأكيد الدفع */}
                        {r.status === 'approved' && (
                          <button
                            onClick={() => setConfirmTarget(r)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium transition-colors"
                          >
                            تأكيد الدفع
                          </button>
                        )}

                        {/* pending/approved → رفض */}
                        {(r.status === 'pending' || r.status === 'approved') && (
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={rejectingId === r.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors disabled:opacity-40"
                          >
                            {rejectingId === r.id ? '...' : 'رفض'}
                          </button>
                        )}

                        {r.status === 'paid' && (
                          <span className="text-xs text-gray-400 font-medium">تم التحويل ✓</span>
                        )}
                        {r.status === 'rejected' && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}