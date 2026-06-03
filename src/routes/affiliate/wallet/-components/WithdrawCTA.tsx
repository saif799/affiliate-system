// ============================================================
// -components/WithdrawCTA.tsx
// ============================================================

import type { WalletBalance } from '../-wallet.types'

interface Props {
  balance: WalletBalance
  onWithdraw: () => void
}

function formatDZD(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' د.ج'
}

export function WithdrawCTA({ balance, onWithdraw }: Props) {
  const { available, minWithdrawAmount } = balance
  const canWithdraw = available >= minWithdrawAmount
  const progress = Math.min((available / minWithdrawAmount) * 100, 100)
  const remaining = minWithdrawAmount - available

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">طلب سحب أموال</p>
          <p className="mt-0.5 text-xs text-gray-500">
            الحد الأدنى للسحب {formatDZD(minWithdrawAmount)} — رصيدك الحالي{' '}
            <span className="font-medium text-emerald-600">
              {formatDZD(available)}
            </span>
          </p>
        </div>
        <button
          onClick={onWithdraw}
          disabled={!canWithdraw}
          className={`shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            canWithdraw
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          طلب سحب
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-gray-400">0 د.ج</span>
          <span className="text-xs text-gray-400">{formatDZD(minWithdrawAmount)}</span>
        </div>
        {!canWithdraw && (
          <p className="mt-1.5 text-center text-xs font-medium text-amber-600">
            باقي لك {formatDZD(remaining)} لتتمكن من السحب
          </p>
        )}
        {canWithdraw && (
          <p className="mt-1.5 text-center text-xs font-medium text-emerald-600">
            يمكنك السحب الآن
          </p>
        )}
      </div>
    </div>
  )
}