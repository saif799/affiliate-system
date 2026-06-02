// merchant/orders/-components/OrdersTable.tsx

import type { Order, OrderStatus, DbOrderStatus } from '../-orders.types'

// next merchant-initiated status + button label for a given DB status
function statusAction(
  db: DbOrderStatus,
): { next: 'confirmed' | 'shipped' | 'returned'; label: string } | null {
  if (db === 'pending') return { next: 'confirmed', label: 'تأكيد' }
  if (db === 'confirmed') return { next: 'shipped', label: 'شحن' }
  if (db === 'shipped' || db === 'at_wilaya') return { next: 'returned', label: 'إرجاع' }
  return null
}

const statusConfig: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  pending:   { label: 'للتغليف',  className: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500'  },
  shipped:   { label: 'في الشحن', className: 'bg-blue-100  text-blue-800',  dot: 'bg-blue-500'   },
  delivered: { label: 'مكتملة',   className: 'bg-green-100 text-green-800', dot: 'bg-green-600'  },
  returned:  { label: 'مسترجعة',  className: 'bg-red-100   text-red-800',   dot: 'bg-red-500'    },
  cancelled: { label: 'ملغاة',    className: 'bg-gray-100  text-gray-600',  dot: 'bg-gray-400'   },
}

interface OrdersTableProps {
  orders: Order[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  onUpdateStatus: (
    orderId: string,
    newStatus: 'confirmed' | 'shipped' | 'returned',
  ) => void
  isUpdating: boolean
}

export function OrdersTable({
  orders,
  selectedIds,
  onToggle,
  onToggleAll,
  onUpdateStatus,
  isUpdating,
}: OrdersTableProps) {
  const allSelected =
    orders.length > 0 && orders.every((o) => selectedIds.has(o.id))
  const someSelected = orders.some((o) => selectedIds.has(o.id))

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-400">لا توجد طلبيات في هذه الفئة</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            {/* Checkbox الكل */}
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                onChange={() =>
                  onToggleAll(allSelected ? [] : orders.map((o) => o.id))
                }
                className="h-3.5 w-3.5 cursor-pointer rounded"
              />
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">رقم الطلب</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المنتج</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الزبون</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الولاية</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">سعر البيع</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">حصتك</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => {
            const status   = statusConfig[order.status]
            const action   = statusAction(order.dbStatus)
            const checked  = selectedIds.has(order.id)

            return (
              <tr
                key={order.id}
                className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                  checked ? 'bg-blue-50/40' : ''
                } ${index === orders.length - 1 ? 'border-b-0' : ''}`}
              >
                {/* Checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(order.id)}
                    className="h-3.5 w-3.5 cursor-pointer rounded"
                  />
                </td>

                {/* رقم الطلب */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-gray-800">
                    {order.id}
                  </span>
                  <p className="text-xs text-gray-400">{order.createdAt}</p>
                </td>

                {/* المنتج */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{order.product.name}</p>
                  <p className="text-xs text-gray-400">{order.product.variant}</p>
                </td>

                {/* الزبون */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{order.customer.name}</p>
                  <p className="font-mono text-xs text-gray-400">{order.customer.phone}</p>
                </td>

                {/* الولاية */}
                <td className="px-4 py-3 text-xs text-gray-600">{order.wilaya}</td>

                {/* سعر البيع */}
                <td className="px-4 py-3 text-xs text-gray-700">
                  {order.totalPrice.toLocaleString('ar-DZ')} DZD
                </td>

                {/* حصة التاجر */}
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-green-600">
                    {order.merchantEarnings.toLocaleString('ar-DZ')} DZD
                  </span>
                </td>

                {/* الحالة */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  {order.trackingNumber && (
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {order.trackingNumber}
                    </p>
                  )}
                </td>

                {/* الإجراءات */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {action && (
                      <button
                        onClick={() => onUpdateStatus(order.id, action.next)}
                        disabled={isUpdating}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    )}
                    <button className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100">
                      تفاصيل
                    </button>
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