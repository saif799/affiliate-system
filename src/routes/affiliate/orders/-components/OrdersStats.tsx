import type { OrdersStats } from '../orders.types'

interface Props {
  stats: OrdersStats
}

export function OrdersStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">إجمالي الطلبيات</p>
        <p className="mt-1.5 text-xl font-bold text-gray-900">
          {stats.total}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">هذا الشهر</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">عمولات مُستحقة</p>
        <p className="mt-1.5 text-xl font-bold text-green-600">
          { (stats?.earnedComm || 0).toLocaleString('ar-DZ') } د.ج
        </p>
        <p className="mt-0.5 text-xs text-gray-400">من طلبيات مُسلّمة</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">قيد الشحن</p>
        <p className="mt-1.5 text-xl font-bold text-blue-600">
          {stats.inShipping}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">طلبية في الطريق</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <p className="text-xs text-gray-500">معدل الاستلام</p>
        <p className="mt-1.5 text-xl font-bold text-green-600">
          {stats.deliveryRate}%
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {100 - stats.deliveryRate}% مرتجعة
        </p>
      </div>
    </div>
  )
}