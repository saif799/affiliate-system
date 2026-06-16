import type { AffiliateOrder, OrderStatus } from '../-orders.types'

const STATUS_MAP: Record<OrderStatus, { label: string; dot: string; bg: string; text: string }> = {
  pending:   { label: 'بانتظار التأكيد', dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-800'  },
  shipping:  { label: 'قيد الشحن',       dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-800'   },
  delivered: { label: 'مُسلّمة',          dot: 'bg-green-600',  bg: 'bg-green-50',  text: 'text-green-800'  },
  returned:  { label: 'مرتجعة',          dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-800'    },
}

interface Props {
  orders: AffiliateOrder[]
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
  onConfirm: (rawId: string) => void
  onReject: (rawId: string) => void
  onView: (order: AffiliateOrder) => void
  onEdit: (rawId: string) => void
  busyId: string | null
}

export function OrdersTable({
  orders,
  currentPage,
  totalPages,
  onPageChange,
  onConfirm,
  onReject,
  onView,
  onEdit,
  busyId,
}: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-400">لا توجد طلبيات في هذا التصنيف</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right">
            <th className="px-4 py-3 text-xs font-medium text-gray-500">رقم الطلبية</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">المنتج</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الزبون</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الولاية</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">سعر البيع</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">عمولتي</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const s = STATUS_MAP[order.status]
            return (
              <tr
                key={order.id}
                onClick={() => onView(order)}
                className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-violet-50/40"
              >
                {/* رقم الطلبية */}
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-900">{order.id}</p>
                  <p className="text-xs text-gray-400">{order.date}</p>
                </td>

                {/* المنتج */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-base">
                      {order.productThumb}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 leading-tight">
                        {order.product}
                      </p>
                      <p className="text-xs text-gray-400">{order.sku}</p>
                    </div>
                  </div>
                </td>

                {/* الزبون */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900">{order.customer}</p>
                  <p className="text-xs text-gray-400">{order.phone}</p>
                </td>

                {/* الولاية */}
                <td className="px-4 py-3 text-xs text-gray-700">{order.wilaya}</td>

                {/* السعر */}
                <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                  {order.price.toLocaleString('ar-DZ')} د.ج
                </td>

                {/* العمولة */}
                <td className="px-4 py-3 text-xs font-bold text-violet-600">
                  {order.commission.toLocaleString('ar-DZ')} د.ج
                </td>

                {/* الحالة */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </td>

                {/* إجراء — تفاصيل دائماً + تأكيد/رفض للطلبيات بانتظار المسوّق */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {order.needsAction && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onConfirm(order.rawId) }}
                          disabled={busyId === order.rawId}
                          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onReject(order.rawId) }}
                          disabled={busyId === order.rawId}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          رفض
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onView(order) }}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      تفاصيل
                    </button>
                    {(order.dbStatus === 'pending' || order.dbStatus === 'confirmed') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(order.rawId) }}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        تعديل
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

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-400">
          صفحة {currentPage} من {totalPages}
        </p>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                p === currentPage
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}