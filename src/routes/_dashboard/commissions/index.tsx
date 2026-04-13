import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getCommissionsData }    from './-server/commissions.api'
import { CommissionStatsCard }   from './-components/CommissionStatsCard'
import { MonthlyPayoutsChart }   from './-components/MonthlyPayoutsChart'
import { PayoutTable }           from './-components/PayoutTable'
import { TransactionHistory }    from './-components/TransactionHistory'
import type { CommissionMetric } from './commissions.types'

export const Route = createFileRoute('/_dashboard/commissions/')({
  loader: () => getCommissionsData(),

  pendingComponent: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
    </div>
  ),
  component: CommissionsPage,
})

// ─── stat cards config ────────────────────────────────

const statCards: {
  key:    keyof ReturnType<typeof buildStats>
  label:  string
  icon:   string
  format: 'dzd' | 'number'
}[] = [
  { key: 'pendingPayouts',  label: 'الرصيد المعلق',         icon: '⏳', format: 'dzd'    },
  { key: 'totalPaid',       label: 'إجمالي المدفوع',        icon: '💸', format: 'dzd'    },
  { key: 'platformRevenue', label: 'أرباح المنصة',          icon: '💰', format: 'dzd'    },
  { key: 'pendingRequests', label: 'طلبات بانتظار المراجعة', icon: '📋', format: 'number' },
]

function buildStats() {
  const { stats } = useLoaderData({ from: '/_dashboard/commissions/' })
  return stats
}

// ─── page ─────────────────────────────────────────────

function CommissionsPage() {
  const { stats, payoutRequests, transactions, monthlyPayouts } =
    useLoaderData({ from: '/_dashboard/commissions/' })

  return (
    <div className="flex flex-col gap-4 p-5" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">العمولات</h1>
        <p className="text-xs text-gray-400">غرفة العمليات المالية — معالجة طلبات السحب</p>
      </div>

      {/* KPI Cards — 4 أعمدة */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <CommissionStatsCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            metric={stats[card.key] as CommissionMetric}
            format={card.format}
          />
        ))}
      </div>

      {/* Monthly Payouts Chart */}
      <MonthlyPayoutsChart data={monthlyPayouts} />

      {/* Payout Requests Table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">طلبات السحب</h2>
        <PayoutTable requests={payoutRequests} />
      </div>

      {/* Transaction History */}
      <TransactionHistory transactions={transactions} />

    </div>
  )
}