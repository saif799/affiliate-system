// -components/TransactionHistory.tsx

import type { TransactionRecord } from '../-commissions.types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function TransactionHistory({ records }: { records: TransactionRecord[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex justify-between items-baseline mb-4">
        <p className="text-sm font-medium text-gray-800">سجل المعاملات المكتملة</p>
        <p className="text-xs text-gray-400">أرشيف محاسبي</p>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">لا توجد معاملات مكتملة بعد</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '21%' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100">
                {['الرقم المرجعي', 'المستفيد', 'المبلغ', 'الوسيلة', 'تاريخ الدفع'].map((h) => (
                  <th
                    key={h}
                    className="text-right text-[11px] text-gray-400 font-medium pb-3 px-2"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-2">
                    <span className="text-[11px] font-mono text-blue-600">{r.txnRef}</span>
                  </td>
                  <td className="py-3.5 px-2">
                    <p className="font-medium text-gray-800 leading-tight">{r.recipientName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {r.recipientWilaya ?? '—'} —{' '}
                      {r.recipientRole === 'merchant' ? 'تاجر' : 'مسوّق'}
                    </p>
                  </td>
                  <td className="py-3.5 px-2 font-medium text-green-600">
                    {r.amount.toLocaleString('ar-DZ')} دج
                  </td>
                  <td className="py-3.5 px-2">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                        r.method === 'BaridiMob'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {r.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-xs text-gray-400">{formatDate(r.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}