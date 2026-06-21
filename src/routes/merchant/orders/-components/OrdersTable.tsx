// merchant/orders/-components/OrdersTable.tsx

import type { Order, OrderStatus, DbOrderStatus } from '../-orders.types'

// إجراء التاجر الوحيد: شحن الطلبية المؤكَّدة. ما بعد الشحن مصدره شركة التوصيل.
function statusAction(
  db: DbOrderStatus,
): { next: 'shipped'; label: string } | null {
  if (db === 'confirmed') return { next: 'shipped', label: 'شحن' }
  return null
}

// مرجع مختصر مقروء بدل UUID الخام (نفس صيغة بقية الصفحات)
const shortRef = (id: string) =>
  `ORD-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

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
  onUpdateStatus: (orderId: string) => void
  onViewDetails: (order: Order) => void
  onPrintLabel: (orderId: string) => void
  isUpdating: boolean
}

export function OrdersTable({
  orders,
  selectedIds,
  onToggle,
  onToggleAll,
  onUpdateStatus,
  onViewDetails,
  onPrintLabel,
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
    <>
    {/* ─── عرض البطاقات على الجوّال (أقل من md) ─── */}
    <div className="space-y-3 md:hidden">
      {/* تحديد الكل على الجوّال */}
      <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected
          }}
          onChange={() => onToggleAll(allSelected ? [] : orders.map((o) => o.id))}
          className="h-3.5 w-3.5 cursor-pointer rounded"
        />
        تحديد الكل
      </label>

      {orders.map((order) => {
        const status = statusConfig[order.status]
        const action = statusAction(order.dbStatus)
        const checked = selectedIds.has(order.id)
        return (
          <div
            key={order.id}
            className={`rounded-xl border bg-white p-4 ${
              checked ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(order.id)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-gray-800">
                    {shortRef(order.id)}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{order.createdAt}</p>
                <p className="mt-2 break-words text-xs font-medium text-gray-800">
                  {order.product.name}
                </p>
                {order.product.variant && (
                  <p className="text-xs text-gray-400">{order.product.variant}</p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-gray-400">الولاية: </span>
                    <span className="text-gray-700">{order.wilaya}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">التوصيل: </span>
                    <span className="text-gray-700">
                      {order.deliveryType === 'office' ? 'مكتب' : 'منزل'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">سعر البيع: </span>
                    <span className="text-gray-700">
                      {order.totalPrice.toLocaleString('ar-DZ')} DZD
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">حصتك: </span>
                    <span className="font-semibold text-green-600">
                      {order.merchantEarnings.toLocaleString('ar-DZ')} DZD
                    </span>
                  </div>
                </div>

                {order.trackingNumber && (
                  <p className="mt-2 font-mono text-xs text-gray-400">
                    {order.trackingNumber}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {action && (
                    <button
                      onClick={() => onUpdateStatus(order.id)}
                      disabled={isUpdating}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  )}
                  <button
                    onClick={() => onViewDetails(order)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    تفاصيل
                  </button>
                  {order.trackingNumber && (
                    <button
                      onClick={() => onPrintLabel(order.id)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      ملصق
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>

    {/* ─── جدول سطح المكتب (md فأعلى) ─── */}
    {/* overflow-x-auto بدل overflow-hidden: تُمرَّر الأعمدة أفقيّاً على الشاشات المتوسطة بدل أن تُقصّ. */}
    <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
      <table className="w-full min-w-[900px] text-sm">
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
            <th className="px-4 py-3 text-xs font-medium text-gray-500">التوصيل</th>
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
                  <span className="font-mono text-xs font-medium text-gray-800 whitespace-nowrap">
                    {shortRef(order.id)}
                  </span>
                  <p className="text-xs text-gray-400">{order.createdAt}</p>
                </td>

                {/* المنتج */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{order.product.name}</p>
                  <p className="text-xs text-gray-400">{order.product.variant}</p>
                </td>

                {/* التوصيل (لا بيانات شخصية للزبون) */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">
                    {order.deliveryType === 'office' ? 'مكتب' : 'منزل'}
                  </p>
                  {order.deliveryType === 'office' && order.officeName && (
                    <p className="text-xs text-gray-400">{order.officeName}</p>
                  )}
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
                        onClick={() => onUpdateStatus(order.id)}
                        disabled={isUpdating}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(order)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      تفاصيل
                    </button>
                    {order.trackingNumber && (
                      <button
                        onClick={() => onPrintLabel(order.id)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        ملصق
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}