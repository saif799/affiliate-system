import type { Transaction } from '../commissions.types'

interface Props {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">سجل المعاملات</h2>
        <p className="text-xs text-gray-400">التحويلات المكتملة — أرشيف محاسبي</p>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="px-4 py-3 text-xs font-medium text-gray-400">الرقم المرجعي</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-400">المستفيد</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-400">المبلغ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-400">طريقة الدفع</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-400">تاريخ الدفع</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}
              className="border-b border-gray-50 text-right last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-indigo-600">{t.referenceNumber}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{t.beneficiaryName}</div>
                <div className="text-xs text-gray-400">
                  {t.beneficiaryType === 'affiliate' ? 'مسوّق' : 'تاجر'} — {t.wilaya}
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-green-600">
                {t.amount.toLocaleString('fr-DZ')} DZD
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  t.paymentMethod === 'baridimob'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {t.paymentMethod === 'baridimob' ? 'BaridiMob' : 'CCP'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">{t.paidAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}