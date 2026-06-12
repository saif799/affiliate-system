// ============================================================
// -components/BalanceCards.tsx
// ============================================================

import type { WalletBalance } from '../-wallet.types'

interface Props {
  balance: WalletBalance
}

function formatDZD(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' د.ج'
}

export function BalanceCards({ balance }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* الرصيد المتاح */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">الرصيد المتاح للسحب</p>
        <p className="mt-1.5 text-xl font-bold text-emerald-600">
          {formatDZD(balance.available)}
        </p>
        <p className="mt-1 text-xs text-gray-400">من الطلبيات المُسلّمة</p>
      </div>

      {/* الرصيد المعلق */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">الرصيد المعلق</p>
        <p className="mt-1.5 text-xl font-bold text-amber-600">
          {formatDZD(balance.pending)}
        </p>
        <p className="mt-1 text-xs text-gray-400">طلبيات قيد التوصيل</p>
      </div>

      {/* إجمالي الأرباح */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">إجمالي الأرباح</p>
        <p className="mt-1.5 text-xl font-bold text-gray-900">
          {formatDZD(balance.totalEarned)}
        </p>
        <p className="mt-1 text-xs text-gray-400">منذ الانضمام للمنصة</p>
      </div>
    </div>
  )
}