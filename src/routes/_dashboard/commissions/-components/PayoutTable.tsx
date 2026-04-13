import { useState } from 'react'
import type { PayoutRequest, PayoutStatus, PaymentMethod } from '../commissions.types'

interface Props {
  requests: PayoutRequest[]
}

// ─── helpers ─────────────────────────────────────────

const STATUS_LABEL: Record<PayoutStatus, string> = {
  pending:   'قيد المعالجة',
  verifying: 'قيد التحقق',
  paid:      'مكتمل',
  rejected:  'مرفوض',
}
const STATUS_CLASS: Record<PayoutStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  verifying: 'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
}
const METHOD_LABEL: Record<PaymentMethod, string> = {
  baridimob: 'BaridiMob',
  ccp:       'CCP',
}

type FilterStatus = PayoutStatus | 'all'

const FILTER_BUTTONS: { label: string; value: FilterStatus }[] = [
  { label: 'الكل',          value: 'all'       },
  { label: 'قيد المعالجة', value: 'pending'   },
  { label: 'قيد التحقق',   value: 'verifying' },
  { label: 'مكتمل',        value: 'paid'      },
  { label: 'مرفوض',        value: 'rejected'  },
]

// ─── modals ───────────────────────────────────────────

function RejectModal({
  request,
  onConfirm,
  onClose,
}: {
  request: PayoutRequest
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-96 rounded-xl bg-white p-6 shadow-xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1 text-base font-semibold text-gray-900">رفض الطلب</h3>
        <p className="mb-4 text-sm text-gray-500">
          رفض طلب سحب <span className="font-medium text-gray-800">{request.beneficiaryName}</span> بمبلغ{' '}
          <span className="font-medium text-gray-800">{request.amount.toLocaleString('fr-DZ')} DZD</span>
        </p>
        <label className="mb-1 block text-xs font-medium text-gray-600">سبب الرفض (إلزامي)</label>
        <textarea
          className="mb-4 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-red-400"
          rows={3}
          placeholder="مثال: رقم الحساب غير صحيح — يرجى المراجعة..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            إلغاء
          </button>
          <button
            type="button"
            disabled={reason.trim().length < 5}
            onClick={() => reason.trim().length >= 5 && onConfirm(reason.trim())}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            تأكيد الرفض
          </button>
        </div>
      </div>
    </div>
  )
}

function MarkPaidModal({
  request,
  onConfirm,
  onClose,
}: {
  request: PayoutRequest
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-96 rounded-xl bg-white p-6 shadow-xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1 text-base font-semibold text-gray-900">تأكيد الدفع</h3>
        <p className="mb-4 text-sm text-gray-500">
          تأكيد دفع <span className="font-medium text-gray-800">{request.amount.toLocaleString('fr-DZ')} DZD</span>{' '}
          لـ <span className="font-medium text-gray-800">{request.beneficiaryName}</span>
        </p>
        <div className="mb-4 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-400 mb-2">ارفع صورة وصل التحويل (Reçu)</p>
          <input type="file" accept="image/*" className="text-xs text-gray-500" />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            إلغاء
          </button>
          <button type="button" onClick={onConfirm}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
            تأكيد الدفع
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────

export function PayoutTable({ requests }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [search, setSearch]             = useState('')
  const [minAmount, setMinAmount]       = useState('')
  const [rejectTarget, setRejectTarget] = useState<PayoutRequest | null>(null)
  const [paidTarget, setPaidTarget]     = useState<PayoutRequest | null>(null)

  const filtered = requests.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchSearch =
      r.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
      r.accountNumber.includes(search) ||
      r.wilaya.toLowerCase().includes(search.toLowerCase())
    const matchAmount = minAmount === '' || r.amount >= Number(minAmount)
    return matchStatus && matchSearch && matchAmount
  })

  return (
    <>
      {/* ─── filters ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          className="flex-1 min-w-50 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          placeholder="ابحث بالاسم أو رقم RIP أو الولاية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          dir="rtl"
        />
        <input
          type="number"
          className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          placeholder="أدنى مبلغ (DZD)"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          dir="rtl"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterStatus(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── table ────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              <th className="px-4 py-3 text-xs font-medium text-gray-400">المستفيد</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">المبلغ</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">طريقة الدفع</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">رقم الحساب</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">تاريخ الطلب</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">الحالة</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}
                  className="border-b border-gray-50 text-right last:border-0 hover:bg-gray-50 transition-colors">

                  {/* beneficiary */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.beneficiaryName}</div>
                    <div className="text-xs text-gray-400">
                      {r.beneficiaryType === 'affiliate' ? 'مسوّق' : 'تاجر'} — {r.wilaya}
                    </div>
                  </td>

                  {/* amount */}
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {r.amount.toLocaleString('fr-DZ')} DZD
                  </td>

                  {/* method */}
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.paymentMethod === 'baridimob'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {METHOD_LABEL[r.paymentMethod]}
                    </span>
                  </td>

                  {/* account */}
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {r.accountNumber}
                  </td>

                  {/* date */}
                  <td className="px-4 py-3 text-xs text-gray-500">{r.requestedAt}</td>

                  {/* status */}
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.rejectionReason && (
                      <div className="mt-1 text-xs text-red-500 max-w-40 truncate" title={r.rejectionReason}>
                        {r.rejectionReason}
                      </div>
                    )}
                  </td>

                  {/* actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {(r.status === 'pending' || r.status === 'verifying') && (
                        <button type="button"
                          onClick={() => setPaidTarget(r)}
                          className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                          تأكيد الدفع
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button type="button"
                          onClick={() => setRejectTarget(r)}
                          className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200">
                          رفض
                        </button>
                      )}
                      {r.receiptUrl && (
                        <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
                          وصل ✓
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── modals ───────────────────────────────── */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={(reason) => {
            console.log('reject', rejectTarget.id, reason)
            setRejectTarget(null)
          }}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {paidTarget && (
        <MarkPaidModal
          request={paidTarget}
          onConfirm={() => {
            console.log('paid', paidTarget.id)
            setPaidTarget(null)
          }}
          onClose={() => setPaidTarget(null)}
        />
      )}
    </>
  )
}