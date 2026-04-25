import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Wallet, ArrowDownToLine, Clock } from 'lucide-react'
import { getWalletData } from './-server/wallet.api'
import { WalletKPIs } from './-components/WalletKPIs'
import { PayoutModal } from './-components/PayoutModal'
import { TransactionsTable } from './-components/TransactionsTable'
import { PayoutHistoryTable } from './-components/PayoutHistoryTable'

export const Route = createFileRoute('/merchant/wallet/')({
  loader: () => getWalletData(),
  pendingComponent: () => (
    <div className="flex items-center justify-center h-64 text-sm text-gray-400">
      جاري التحميل...
    </div>
  ),
  component: WalletPage,
})

type Tab = 'transactions' | 'payouts'

function WalletPage() {
  const data = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState<Tab>('transactions')
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)

  const fmt = (n: number) => n.toLocaleString('ar-DZ')
  const canWithdraw = data.stats.availableBalance >= data.stats.minimumPayout

  return (
    // 👇 هنا تم إضافة الهوامش p-6 و md:p-8 لترك مسافة تنفس للصفحة
    <div className="p-2 space-y-2 md:p-2" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المحفظة</h1>
          <p className="text-sm text-gray-500">إدارة أرباحك وطلبات السحب</p>
        </div>
        <button
          onClick={() => setIsPayoutModalOpen(true)}
          disabled={!canWithdraw}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownToLine size={14} />
          طلب سحب أموال
        </button>
      </div>

      {/* KPI Cards */}
      <WalletKPIs stats={data.stats} />

      {/* Minimum Payout Notice */}
      {!canWithdraw && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            الحد الأدنى للسحب هو{' '}
            <span className="font-bold">{fmt(data.stats.minimumPayout)} DZD</span>.
            رصيدك الحالي{' '}
            <span className="font-bold">{fmt(data.stats.availableBalance)} DZD</span>.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
            activeTab === 'transactions'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Wallet size={13} />
          المعاملات
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === 'transactions' ? 'bg-white/20' : 'bg-gray-100'
            }`}
          >
            {data.transactions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
            activeTab === 'payouts'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ArrowDownToLine size={13} />
          تاريخ السحوبات
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === 'payouts' ? 'bg-white/20' : 'bg-gray-100'
            }`}
          >
            {data.payoutHistory.length}
          </span>
        </button>
      </div>

      {/* Table */}
      {activeTab === 'transactions' ? (
        <TransactionsTable transactions={data.transactions} />
      ) : (
        <PayoutHistoryTable history={data.payoutHistory} />
      )}

      {/* Payout Modal */}
      <PayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={data.stats.availableBalance}
        minimumPayout={data.stats.minimumPayout}
        payoutMethods={data.payoutMethods}
      />
    </div>
  )
}