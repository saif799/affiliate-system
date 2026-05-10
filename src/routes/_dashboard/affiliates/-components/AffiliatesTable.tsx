import type { Affiliate } from '../-affiliates.types'

interface Props {
  affiliates: Affiliate[]
}

const statusConfig = {
  active: { label: 'نشط', class: 'bg-green-100 text-green-700' },
  suspended: { label: 'معلق', class: 'bg-red-100 text-red-700' },
  pending: { label: 'قيد الانتظار', class: 'bg-yellow-100 text-yellow-700' },
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${color}`}
    >
      {initials}
    </div>
  )
}

export function AffiliatesTable({ affiliates }: Props) {
  if (affiliates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-400 text-sm">لا يوجد مسوقون مطابقون للبحث</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              المسوق
            </th>
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              الولاية
            </th>
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              الحالة
            </th>
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              التحويلات
            </th>
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              المبيعات
            </th>
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              العمولة
            </th>
            <th className="text-right text-gray-500 font-medium px-5 py-3">
              إجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {affiliates.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={a.name} />
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-gray-400 text-xs">{a.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-gray-600">{a.wilaya}</td>
              <td className="px-5 py-4">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[a.status].class}`}
                >
                  {statusConfig[a.status].label}
                </span>
              </td>
              <td className="px-5 py-4 text-gray-700 font-medium">
                {a.conversions.toLocaleString()}
              </td>
              <td className="px-5 py-4 text-gray-700 font-medium">
                {new Intl.NumberFormat('fr-DZ').format(a.totalSales)} DZD
              </td>
              <td className="px-5 py-4">
                <span className="text-blue-600 font-semibold">
                  {a.commissionRate}%
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors">
                    عرض
                  </button>
                  <button
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      a.status === 'active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {a.status === 'active' ? 'تعليق' : 'تفعيل'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
