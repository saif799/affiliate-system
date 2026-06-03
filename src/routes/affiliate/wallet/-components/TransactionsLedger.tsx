// ============================================================
// -components/TransactionsLedger.tsx
// ============================================================

import { useState } from 'react'
import type { Transaction, WithdrawalRequest } from '../-wallet.types'

interface Props {
  transactions: Transaction[]
  withdrawals: WithdrawalRequest[]
}

function formatDZD(amount: number): string {
  return Math.abs(amount).toLocaleString('ar-DZ') + ' د.ج'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TRANSACTION_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  commission: { label: 'عمولة', color: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
  withdrawal: { label: 'سحب', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  deduction: { label: 'خصم', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
}

const WITHDRAWAL_STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
  pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
}

const METHOD_LABELS: Record<string, string> = {
  ccp: 'CCP — بريدي',
  bank: 'حساب بنكي',
}

function StatusBadge({ config }: { config: { label: string; color: string; dot: string } }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function TransactionsLedger({ transactions, withdrawals }: Props) {
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions')

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 bg-gray-50 p-2">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
            activeTab === 'transactions'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          سجل المعاملات
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === 'transactions' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {transactions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
            activeTab === 'withdrawals'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          تاريخ السحوبات
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === 'withdrawals' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {withdrawals.length}
          </span>
        </button>
      </div>

      {/* جدول المعاملات */}
      {activeTab === 'transactions' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">التفاصيل</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">التاريخ</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">النوع</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const typeConfig = TRANSACTION_LABELS[tx.type]
              const isPositive = tx.amount > 0
              return (
                <tr
                  key={tx.id}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{tx.description}</p>
                    {tx.orderId && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {tx.orderId}
                        {tx.productName && ` · ${tx.productName}`}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge config={typeConfig} />
                  </td>
                  <td className="px-4 py-3 text-left">
                    <span
                      className={`text-xs font-bold ${
                        isPositive ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : '-'}
                      {formatDZD(tx.amount)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* جدول السحوبات */}
      {activeTab === 'withdrawals' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">رقم المرجع</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">التاريخ</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">طريقة الدفع</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">المبلغ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => {
              const statusConfig = WITHDRAWAL_STATUS_LABELS[w.status]
              return (
                <tr
                  key={w.id}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-gray-900">{w.id}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(w.date)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">
                      {METHOD_LABELS[w.method]}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{w.accountNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">
                    {formatDZD(w.amount)}
                  </td>
                  <td className="px-4 py-3 text-left">
                    <StatusBadge config={statusConfig} />
                    {w.rejectionReason && (
                      <p className="mt-1 text-xs text-red-400">{w.rejectionReason}</p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}