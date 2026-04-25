import type { PayoutRequest } from '../wallet.types'

const statusConfig: Record<
  PayoutRequest['status'],
  { label: string; dot: string; text: string }
> = {
  completed: { label: 'مكتمل', dot: 'bg-green-500', text: 'text-green-800 bg-green-100' },
  pending: { label: 'معلق', dot: 'bg-amber-500', text: 'text-amber-800 bg-amber-100' },
  processing: { label: 'قيد المعالجة', dot: 'bg-blue-500', text: 'text-blue-800 bg-blue-100' },
  rejected: { label: 'مرفوض', dot: 'bg-red-500', text: 'text-red-800 bg-red-100' },
}

interface PayoutHistoryTableProps {
  history: PayoutRequest[]
}

export function PayoutHistoryTable({ history }: PayoutHistoryTableProps) {
  const fmt = (n: number) => n.toLocaleString('ar-DZ')

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ar-DZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المرجع والتاريخ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">طريقة الدفع</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المبلغ المطلوب</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الرسوم</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الصافي</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {history.map((payout) => {
            const status = statusConfig[payout.status]
            return (
              <tr
                key={payout.id}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{payout.reference}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(payout.requestedAt)}</p>
                </td>

                <td className="px-4 py-3">
                  <p className="text-xs text-gray-700">{payout.methodLabel}</p>
                </td>

                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{fmt(payout.amount)} DZD</p>
                </td>

                <td className="px-4 py-3">
                  <p className="text-xs text-red-500">
                    {payout.fee > 0 ? `- ${fmt(payout.fee)} DZD` : '—'}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <p className="text-xs font-bold text-green-700">{fmt(payout.netAmount)} DZD</p>
                </td>

                <td className="px-4 py-3">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    {payout.status === 'rejected' && payout.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">{payout.rejectionReason}</p>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}