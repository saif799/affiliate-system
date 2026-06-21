import { useState, useEffect } from 'react'
import { X, Loader2, Package, MapPin, Truck } from 'lucide-react'
import { getOrderTracking } from '#/server/delivery/tracking.api'
import type { TrackingEventView } from '#/server/delivery/tracking.api'
import type { Order } from '../-orders.types'

interface Props {
  order: Order | null
  onClose: () => void
}

export function OrderDetailsModal({ order, onClose }: Props) {
  const [events, setEvents] = useState<TrackingEventView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!order) return
    let cancelled = false
    setEvents([])
    setError('')
    // التتبّع متاح فقط بعد الشحن (وجود رقم تتبّع)
    if (!order.trackingNumber) return
    setLoading(true)
    getOrderTracking({ data: { orderId: order.id } })
      .then((rows) => {
        if (!cancelled) setEvents(rows)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'تعذّر تحميل سجلّ التتبّع')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [order])

  if (!order) return null

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-end text-xs font-medium text-gray-800">{value}</span>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">تفاصيل الطلبية</h2>
            <p className="mt-0.5 font-mono text-xs text-gray-400">{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex max-h-[72vh] flex-col gap-4 overflow-y-auto px-5 py-4">
          {/* المنتج + المبالغ */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-800">
              <Package size={14} className="text-gray-400" /> {order.product.name}
            </div>
            <Row label="الكمية" value={String(order.quantity)} />
            <Row label="سعر البيع (COD)" value={`${order.totalPrice.toLocaleString('ar-DZ')} د.ج`} />
            <Row label="حصتك" value={`${order.merchantEarnings.toLocaleString('ar-DZ')} د.ج`} />
          </div>

          {/* التوصيل (بيانات الزبون الشخصية مخفيّة عن التاجر) */}
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-800">
              <MapPin size={14} className="text-gray-400" /> التوصيل
            </div>
            <Row label="الولاية" value={order.wilaya} />
            <Row
              label="نوع التوصيل"
              value={order.deliveryType === 'office' ? 'مكتب (Stop Desk)' : 'منزل'}
            />
            {order.deliveryType === 'office' && order.officeName && (
              <Row label="المكتب" value={order.officeName} />
            )}
            <p className="mt-2 text-[11px] text-gray-400">
              بيانات الزبون الشخصية (الاسم/الهاتف/العنوان) محميّة ولا تظهر للتاجر.
            </p>
          </div>

          {/* التتبّع */}
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                <Truck size={14} className="text-gray-400" /> تتبّع الشحنة
              </div>
              {order.trackingNumber && (
                <span className="font-mono text-xs text-gray-400">{order.trackingNumber}</span>
              )}
            </div>

            {!order.trackingNumber ? (
              <p className="py-2 text-center text-xs text-gray-400">
                لم تُشحَن بعد — لا يوجد سجلّ تتبّع
              </p>
            ) : loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400">
                <Loader2 size={14} className="animate-spin" /> جارٍ تحميل سجلّ التتبّع...
              </div>
            ) : error ? (
              <p className="py-2 text-center text-xs text-red-500">{error}</p>
            ) : events.length === 0 ? (
              <p className="py-2 text-center text-xs text-gray-400">
                لا توجد تحديثات من شركة التوصيل بعد
              </p>
            ) : (
              <ol className="relative space-y-3 border-r border-gray-100 pr-4">
                {events.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -right-[21px] top-1 h-2 w-2 rounded-full bg-blue-500" />
                    <p className="text-xs font-medium text-gray-800">{ev.statusLabel}</p>
                    {ev.description && (
                      <p className="text-xs text-gray-500">{ev.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(ev.occurredAt).toLocaleString('ar-DZ')}
                      {ev.wilaya ? ` — ${ev.wilaya}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
