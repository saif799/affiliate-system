// src/routes/merchant/affiliates/-components/AffiliatesTable.tsx

import type { Affiliate } from '../-affiliates.types'

const TIER_LABELS = { gold: 'ذهبي', silver: 'فضي', bronze: 'برونزي' }
const TIER_CLASSES = {
  gold: 'bg-yellow-50 text-yellow-800',
  silver: 'bg-slate-100 text-slate-600',
  bronze: 'bg-amber-50 text-amber-800',
}

function formatDZD(amount: number): string {
  return `${amount.toLocaleString('en-US')} DZD`
}

interface Props {
  affiliates: Affiliate[]
  onSelect: (affiliate: Affiliate) => void
}

export function AffiliatesTable({ affiliates, onSelect }: Props) {
  if (affiliates.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-400">لا يوجد مسوقون مطابقون للبحث</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        {/* الأعمدة بالترتيب: المسوق · المستوى · الطلبيات · معدل الروتور ·
            إجمالي المبيعات · العمولات · الحالة · إجراءات */}
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '9%' }} />
        </colgroup>

        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              المسوق
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              المستوى
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              الطلبيات
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              معدل الروتور
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              إجمالي المبيعات
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              العمولات
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">
              الحالة
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">
              إجراءات
            </th>
          </tr>
        </thead>

        <tbody>
          {affiliates.map((aff) => {
            const isHighReturn = aff.returnRate > 20
            const joinYear = new Date(aff.joinedAt).getFullYear()
            const joinMonth = new Date(aff.joinedAt).toLocaleString('ar-DZ', {
              month: 'long',
            })

            return (
              <tr
                key={aff.id}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50"
              >
                {/* المسوق */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: aff.avatarColor,
                        color: '#374151',
                      }}
                    >
                      {aff.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-900">
                        {aff.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        منذ {joinMonth} {joinYear}
                      </p>
                    </div>
                  </div>
                </td>

                {/* المستوى */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_CLASSES[aff.tier]}`}
                  >
                    {TIER_LABELS[aff.tier]}
                  </span>
                </td>

                {/* الطلبيات */}
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-gray-900">
                    {aff.totalOrders}
                  </span>
                  <span className="mr-1 text-xs text-gray-400">
                    / {aff.deliveredOrders} مُسلم
                  </span>
                </td>

                {/* معدل الروتور */}
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium ${isHighReturn ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {aff.returnRate}%{isHighReturn && ' !'}
                  </span>
                </td>

                {/* إجمالي المبيعات */}
                <td className="px-4 py-3 text-xs text-gray-700">
                  {formatDZD(aff.totalSales)}
                </td>

                {/* العمولات */}
                <td className="px-4 py-3 text-xs text-gray-700">
                  {formatDZD(aff.totalCommissions)}
                </td>

                {/* الحالة */}
               
                <td className="px-4 py-3">
                  {aff.status === 'active' ? (
                    <span className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                      نشط
                    </span>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                      محظور
                    </span>
                  )}
                </td>

                {/* إجراءات */}
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => onSelect(aff)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 active:scale-95"
                  >
                    تفاصيل
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
