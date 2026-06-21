// ============================================================
// -components/WithdrawModal.tsx
// ============================================================

import { useState } from 'react'
import { X, CreditCard, Building2, AlertCircle } from 'lucide-react'
import type { WithdrawFormData, PaymentMethod } from '../-wallet.types'

interface Props {
  availableBalance: number
  onClose: () => void
  onSubmit: (data: WithdrawFormData) => Promise<void>
}

function formatDZD(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' د.ج'
}

export function WithdrawModal({ availableBalance, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<PaymentMethod>('CCP')
  const [accountNumber, setAccountNumber] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const numericAmount = Number(amount)
  const isValidAmount =
    numericAmount > 0 && numericAmount <= availableBalance
  const isFormValid = isValidAmount && accountNumber.trim().length > 0

  async function handleSubmit() {
    if (!isFormValid) return
    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit({
        amount: numericAmount,
        method,
        accountNumber: accountNumber.trim(),
      })
      onClose()
    } catch {
      setError('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مجدداً.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // إغلاق عند النقر على الخلفية
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:mx-4 sm:rounded-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">طلب سحب أموال</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* الرصيد المتاح */}
        <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2.5">
          <p className="text-xs text-gray-500">
            الرصيد المتاح:{' '}
            <span className="font-medium text-emerald-600">{formatDZD(availableBalance)}</span>
          </p>
        </div>

        {/* حقل المبلغ */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-gray-500">المبلغ المطلوب (د.ج)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="أدخل المبلغ..."
            min={1}
            max={availableBalance}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-gray-400"
          />
          {numericAmount > availableBalance && (
            <p className="mt-1 text-xs text-red-500">المبلغ يتجاوز رصيدك المتاح</p>
          )}
        </div>

        {/* طريقة الدفع */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-gray-500">طريقة الدفع</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod('CCP')}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-xs transition-colors sm:px-3 ${
                method === 'CCP'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <CreditCard size={14} className="shrink-0" />
              <span className="truncate">CCP — بريدي</span>
            </button>
            <button
              onClick={() => setMethod('BaridiMob')}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-xs transition-colors sm:px-3 ${
                method === 'BaridiMob'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Building2 size={14} className="shrink-0" />
              <span className="truncate">BaridiMob</span>
            </button>
          </div>
        </div>

        {/* رقم الحساب */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-gray-500">
            {method === 'CCP' ? 'رقم CCP' : 'رقم BaridiMob (RIP)'}
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={method === 'CCP' ? 'مثال: 0799 123 456' : 'مثال: 007999990001079912'}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-gray-400"
          />
        </div>

        {/* خطأ */}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* زر التأكيد */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`w-full rounded-lg py-2.5 text-xs font-medium transition-colors ${
            isFormValid && !isSubmitting
              ? 'bg-gray-900 text-white hover:bg-gray-700'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          {isSubmitting ? 'جارٍ الإرسال...' : 'تأكيد طلب السحب'}
        </button>
      </div>
    </div>
  )
}