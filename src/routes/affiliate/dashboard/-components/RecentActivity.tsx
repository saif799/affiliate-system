import type { RecentOrder, OrderStatus } from '../dashboard.types'

interface Props {
  orders: RecentOrder[]
}

const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  processing: { label: 'قيد المعالجة', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  confirmed: { label: 'مؤكدة', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  shipped: { label: 'مشحونة', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  delivered: { label: 'مستلمة', color: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
  returned: { label: 'مرتجعة', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
}

export function RecentActivity({ orders }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">آخر النشاطات</h2>
        <p className="text-xs text-gray-400 mt-0.5">آخر 5 تغييرات في الطلبيات</p>
      </div>
      <div className="divide-y divide-gray-50">
        {orders.map((order) => {
          const status = statusConfig[order.status]
          return (
            <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 shrink-0">
                  {order.orderId.slice(-2)}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">{order.productName}</p>
                  <p className="text-xs text-gray-400">{order.merchantName} · {order.updatedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {order.status === 'delivered' && (
                  <p className="text-xs font-semibold text-green-700">
                    +{order.commission.toLocaleString('ar-DZ')} د.ج
                  </p>
                )}
                {order.status === 'returned' && (
                  <p className="text-xs font-semibold text-red-500">روتور</p>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}