import { useState } from 'react'
import { X, ArrowDownToLine } from 'lucide-react'
import type { PayoutMethodOption } from '../wallet.types'

interface PayoutModalProps {
  isOpen: boolean
  onClose: () => void
  availableBalance: number
  minimumPayout: number
  payoutMethods: PayoutMethodOption[]
}

export function PayoutModal({
  isOpen,
  onClose,
  availableBalance,
  minimumPayout,
  payoutMethods,
}: PayoutModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>(payoutMethods[0]?.id ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const fmt = (n: number) => n.toLocaleString('ar-DZ')

  const numAmount = parseFloat(amount) || 0
  const method = payoutMethods.find((m) => m.id === selectedMethod)
  const fee = method
    ? method.feeType === 'fixed'
      ? method.fee
      : Math.round((numAmount * method.fee) / 100)
    : 0
  const netAmount = numAmount - fee

  const hasError = (numAmount > 0 && numAmount < minimumPayout) || numAmount > availableBalance
  const isValid = numAmount >= minimumPayout && numAmount <= availableBalance
  const showSummary = isValid

  const handleSubmit = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    // محاكاة إرسال الطلب (API Call)
    await new Promise((r) => setTimeout(r, 1200))
    setIsSubmitting(false)
    onClose()
    setAmount('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      {/* تم تحديد العرض بـ 440px ليكون أنيقاً ومتماسكاً */}
      <div className="w-full max-w-110 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
              <ArrowDownToLine size={16} className="text-gray-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">طلب سحب أموال</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                متاح للسحب:{' '}
                <span className="font-semibold text-green-600">{fmt(availableBalance)} DZD</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Body (مع إمكانية التمرير إذا صغرت الشاشة) ─── */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[65vh] custom-scrollbar">

          {/* حقل المبلغ */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              المبلغ المطلوب سحبه
            </label>
            <div
              className={`flex items-center gap-0 rounded-xl border bg-white overflow-hidden transition-colors ${
                hasError
                  ? 'border-red-400 ring-1 ring-red-200'
                  : 'border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-200'
              }`}
            >
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`الحد الأدنى ${fmt(minimumPayout)}`}
                style={{
                  color: '#111827',
                  caretColor: '#111827',
                  WebkitTextFillColor: '#111827',
                  backgroundColor: 'transparent',
                  MozAppearance: 'textfield',
                }}
                className="
                  flex-1 px-4 py-2.5 text-sm font-semibold
                  placeholder:text-gray-300 placeholder:font-normal
                  text-right outline-none
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
              />
              <span className="shrink-0 border-r border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-400 select-none">
                DZD
              </span>
            </div>

            {/* رسائل الخطأ */}
            {numAmount > 0 && numAmount < minimumPayout && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
                <span className="h-1 w-1 rounded-full bg-red-400 shrink-0" />
                الحد الأدنى للسحب هو {fmt(minimumPayout)} DZD
              </p>
            )}
            {numAmount > availableBalance && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
                <span className="h-1 w-1 rounded-full bg-red-400 shrink-0" />
                المبلغ يتجاوز رصيدك المتاح ({fmt(availableBalance)} DZD)
              </p>
            )}
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              طريقة الدفع
            </label>
            <div className="space-y-2">
              {payoutMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                    selectedMethod === m.id
                      ? 'border-gray-900 bg-gray-900/5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedMethod === m.id ? 'border-gray-900' : 'border-gray-300'
                    }`}>
                      {selectedMethod === m.id && (
                        <div className="h-2 w-2 rounded-full bg-gray-900" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payout-method"
                      value={m.id}
                      checked={selectedMethod === m.id}
                      onChange={() => setSelectedMethod(m.id)}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{m.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.accountInfo}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                    m.fee === 0
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.fee === 0
                      ? 'مجاناً'
                      : m.feeType === 'fixed'
                      ? `${m.fee} DZD رسوم`
                      : `${m.fee}% رسوم`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ملخص الشفافية (تم تصغيره ليكون أنيقاً ومتماسكاً) */}
          {showSummary && (
            <div className="rounded-xl border border-gray-200 overflow-hidden mt-2">
              <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs text-gray-500">المبلغ المطلوب</span>
                <span className="text-xs font-semibold text-gray-800">{fmt(numAmount)} DZD</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs text-gray-500">رسوم التحويل</span>
                <span className={`text-xs font-semibold ${fee > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {fee > 0 ? `− ${fmt(fee)} DZD` : 'مجاناً'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 bg-white">
                <span className="text-xs font-bold text-gray-800">الصافي الذي سيصلك</span>
                <span className="text-sm font-bold text-green-700">{fmt(netAmount)} DZD</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-2 rounded-xl bg-gray-900 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                جاري المعالجة...
              </span>
            ) : (
              'تأكيد طلب السحب'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}