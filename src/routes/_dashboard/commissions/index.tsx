// commissions/index.tsx

import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCommissionsPageData } from './-server/commissions.api'
import { CommissionStatsCard } from './-components/CommissionStatsCard'
import { MonthlyPayoutsChart } from './-components/MonthlyPayoutsChart'
import { PayoutTable } from './-components/PayoutTable'
import { TransactionHistory } from './-components/TransactionHistory'
import type { WithdrawalRequest } from './-commissions.types'

// تصدير طلبات السحب إلى CSV من جهة العميل (البيانات محمّلة سلفاً) — مع BOM لـ Excel
const WITHDRAWAL_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'مقبول',
  rejected: 'مرفوض',
  paid: 'مدفوع',
}

function exportWithdrawalsCsv(rows: WithdrawalRequest[]): void {
  const esc = (v: string | number | null) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = [
    'المستخدم', 'الدور', 'الولاية', 'المبلغ (دج)', 'الطريقة',
    'رقم الحساب', 'الحالة', 'تاريخ الطلب', 'تاريخ المعالجة',
  ]
  const lines = rows.map((r) =>
    [
      r.userName,
      r.userRole === 'merchant' ? 'تاجر' : 'مسوّق',
      r.userWilaya,
      r.amount,
      r.method,
      r.accountNumber,
      WITHDRAWAL_STATUS_AR[r.status] ?? r.status,
      r.requestedAt?.slice(0, 10) ?? '',
      r.processedAt?.slice(0, 10) ?? '',
    ]
      .map(esc)
      .join(','),
  )
  const csv = '﻿' + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const Route = createFileRoute('/_dashboard/commissions/')({
  beforeLoad: ({ context }) => {
    const role = context.session?.user?.role
    if (!role) throw redirect({ to: '/login' })
    if (role !== 'super_admin') throw redirect({ to: '/dashboard' })
  },

  loader: () => getCommissionsPageData(),

  pendingComponent: CommissionsPending,

  component: CommissionsPage,
})

function CommissionsPending() {
  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-20 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-gray-100 rounded-xl h-44 animate-pulse" />
        <div className="bg-gray-100 rounded-xl h-44 animate-pulse" />
      </div>
      <div className="bg-gray-100 rounded-xl h-60 animate-pulse" />
      <div className="bg-gray-100 rounded-xl h-72 animate-pulse" />
    </div>
  )
}

function CommissionsPage() {
  const { stats, breakdown, monthlyPayouts, withdrawalRequests, transactionHistory } =
    Route.useLoaderData()

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-medium text-gray-900">العمولات</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            غرفة العمليات المالية — معالجة طلبات السحب
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportWithdrawalsCsv(withdrawalRequests)}
          disabled={withdrawalRequests.length === 0}
          className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          تصدير CSV
        </button>
      </div>

      {/* القسم 1 + 2 */}
      <CommissionStatsCard stats={stats} breakdown={breakdown} />

      {/* القسم 3 */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 tracking-widest mb-3">
          المدفوعات الشهرية
        </p>
        <MonthlyPayoutsChart data={monthlyPayouts} />
      </div>

      {/* القسم 4 */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 tracking-widest mb-3">
          طلبات السحب
        </p>
        <PayoutTable requests={withdrawalRequests} />
      </div>

      {/* القسم 5 */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 tracking-widest mb-3">
          سجل المعاملات المكتملة
        </p>
        <TransactionHistory records={transactionHistory} />
      </div>
    </div>
  )
}