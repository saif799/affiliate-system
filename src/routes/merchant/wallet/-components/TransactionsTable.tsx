import { useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import type { Transaction } from '../-wallet.types'

const typeConfig: Record<
  Transaction['type'],
  { label: string; icon: string; color: string }
> = {
  order_earning: { label: 'أرباح طلبية', icon: '🛒', color: 'text-green-700 bg-green-50' },
  payout_deduction: { label: 'سحب أموال', icon: '🏦', color: 'text-blue-700 bg-blue-50' },
  platform_fee: { label: 'رسوم منصة', icon: '⚙️', color: 'text-gray-600 bg-gray-100' },
  refund_deduction: { label: 'استرداد مُرتجع', icon: '↩️', color: 'text-red-700 bg-red-50' },
}

const statusConfig: Record<
  Transaction['status'],
  { label: string; dot: string; text: string }
> = {
  completed: { label: 'مكتمل', dot: 'bg-green-500', text: 'text-green-800 bg-green-100' },
  pending: { label: 'معلق', dot: 'bg-amber-500', text: 'text-amber-800 bg-amber-100' },
  failed: { label: 'فاشل', dot: 'bg-red-500', text: 'text-red-800 bg-red-100' },
}

interface TransactionsTableProps {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const navigate = useNavigate()

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ar-DZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const fmt = (n: number) => Math.abs(n).toLocaleString('ar-DZ')
  const isPositive = (t: Transaction) => t.amount > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="px-4 py-3 text-xs font-medium text-gray-500">التاريخ والمرجع</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">النوع</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المبلغ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المرجع (الطلبية)</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const type = typeConfig[txn.type]
            const status = statusConfig[txn.status]
            const positive = isPositive(txn)

            return (
              <tr
                key={txn.id}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50"
              >
                {/* التاريخ */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{txn.reference}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(txn.createdAt)}</p>
                </td>

                {/* النوع */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${type.color}`}
                  >
                    <span>{type.icon}</span>
                    {type.label}
                  </span>
                </td>

                {/* المبلغ */}
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-bold ${
                      positive ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {positive ? '+' : '-'} {fmt(txn.amount)} DZD
                  </span>
                </td>

                {/* المرجع */}
                <td className="px-4 py-3">
                  {txn.orderNumber ? (
                    <button
                      onClick={() =>
                        navigate({ to: '/merchant/orders' })
                      }
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {txn.orderNumber}
                      <ExternalLink size={11} />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>

                {/* الحالة */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}