import type { WalletStats } from '../-wallet.types'

interface WalletKPIsProps {
  stats: WalletStats
}

export function WalletKPIs({ stats }: WalletKPIsProps) {
  const fmt = (n: number) => n.toLocaleString('ar-DZ')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* الرصيد المتاح */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">الرصيد المتاح للسحب</p>
          <span className="flex h-2 w-2 rounded-full bg-green-500 ring-4 ring-green-100" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{fmt(stats.availableBalance)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">DZD</p>
        </div>
        <span className="w-fit text-[11px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
          قابل للسحب فوراً
        </span>
      </div>

      {/* الرصيد المعلق */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">الرصيد المعلق</p>
          <span className="flex h-2 w-2 rounded-full bg-amber-400 ring-4 ring-amber-100" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{fmt(stats.pendingBalance)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">DZD</p>
        </div>
        <span className="w-fit text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
          طلبيات قيد الشحن
        </span>
      </div>

      {/* إجمالي المسحوبات */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">إجمالي المسحوبات</p>
          <span className="flex h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-gray-900">{fmt(stats.totalWithdrawn)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">DZD</p>
        </div>
        <span className="w-fit text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
          منذ تاريخ التسجيل
        </span>
      </div>
    </div>
  )
}