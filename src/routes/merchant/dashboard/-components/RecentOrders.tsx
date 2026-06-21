// merchant/dashboard/-components/RecentOrders.tsx

import type { RecentOrder } from '../-dashboard.types'

const statusConfig = {
  pending:   { label: 'انتظار التغليف', color: 'bg-orange-100 text-orange-700' },
  shipped:   { label: 'في التوصيل',     color: 'bg-blue-100   text-blue-700'   },
  delivered: { label: 'مُسلّمة',         color: 'bg-green-100  text-green-700'  },
  returned:  { label: 'مُرتجعة',         color: 'bg-red-100    text-red-700'    },
}

// مرجع مختصر مقروء بدل UUID الخام (نفس صيغة بقية الصفحات)
const shortRef = (id: string) =>
  `ORD-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

interface RecentOrdersProps {
  orders: RecentOrder[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        آخر الطلبيات
      </h2>

      <div className="flex flex-col gap-2">
        {orders.map((order) => {
          const status = statusConfig[order.status]
          return (
            <div
              key={order.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-xs font-medium text-gray-800">
                  {order.productName}
                </span>
                <span className="truncate text-xs text-gray-400">
                  {shortRef(order.id)} · {order.wilaya}
                </span>
              </div>
              <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}