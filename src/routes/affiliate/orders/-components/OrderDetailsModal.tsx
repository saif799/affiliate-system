import { useEffect, useState } from 'react'
import { X, Phone, MapPin, Store, Package, Truck, CheckCircle2 } from 'lucide-react'
import type { AffiliateOrder } from '../-orders.types'
import { getOrderTracking  } from '#/server/delivery/tracking.api'
import type {TrackingEventView} from '#/server/delivery/tracking.api';
import { DeliveryTimeline } from '#/routes/-components/shared/DeliveryTimeline'

interface Props {
  order: AffiliateOrder | null
  onClose: () => void
  onConfirm: (rawId: string) => void
  onReject: (rawId: string) => void
  busy: boolean
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OrderDetailsModal({ order, onClose, onConfirm, onReject, busy }: Props) {
  const [events, setEvents] = useState<TrackingEventView[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!order) {
      setEvents([])
      return
    }
    let active = true
    getOrderTracking({ data: { orderId: order.rawId } })
      .then((rows) => active && setEvents(rows))
      .catch(() => active && setEvents([]))
    return () => {
      active = false
    }
  }, [order])

  if (!order) return null

  const isReturned = order.dbStatus === 'returned'

  // خطوات الرحلة — كل خطوة مكتملة إذا كان لها طابع زمني
  const steps = [
    {
      key: 'created',
      label: 'وصلت الطلبية',
      sub: 'من متجرك الخارجي',
      icon: Package,
      ts: order.createdAt,
    },
    {
      key: 'confirmed',
      label: 'أُرسلت للتاجر',
      sub: order.merchantName,
      icon: Store,
      ts: order.confirmedAt,
    },
    {
      key: 'shipped',
      label: 'التاجر شحنها',
      sub: order.trackingNumber ? `تتبّع: ${order.trackingNumber}` : 'سُلّمت لشركة التوصيل',
      icon: Package,
      ts: order.shippedAt,
    },
    {
      key: 'at_wilaya',
      label: 'في الطريق',
      sub: 'مركز شركة التوصيل بالولاية',
      icon: Truck,
      ts: order.atWilayaAt,
    },
    {
      key: 'delivered',
      label: 'استلمها الزبون',
      sub: 'اكتملت الطلبية',
      icon: CheckCircle2,
      ts: order.deliveredAt,
    },
  ]

  const lastDone = steps.reduce((acc, s, i) => (s.ts ? i : acc), 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">تفاصيل الطلبية {order.id}</h2>
            <p className="text-xs text-gray-400">{order.product}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">الزبون</p>
              <p className="text-sm font-medium text-gray-900">{order.customer}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500" dir="ltr">
                <Phone size={11} /> {order.phone}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={11} /> {order.wilaya}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">المنتج والتاجر</p>
              <p className="text-sm font-medium text-gray-900">{order.product}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Store size={11} /> {order.merchantName}
              </p>
              <p className="mt-1 text-xs text-gray-500">الكمية: {order.quantity}</p>
            </div>
          </div>

          {/* Money */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-gray-100 p-3 text-center">
              <p className="text-xs text-gray-400">سعر البيع</p>
              <p className="mt-0.5 text-sm font-bold text-gray-900">
                {order.price.toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 text-center">
              <p className="text-xs text-gray-400">سعر الجملة</p>
              <p className="mt-0.5 text-sm font-bold text-gray-700">
                {(order.basePrice * order.quantity).toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center">
              <p className="text-xs text-violet-500">ربحك</p>
              <p className="mt-0.5 text-sm font-bold text-violet-700">
                {order.commission.toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
          </div>

          {/* Returned banner */}
          {isReturned && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ هذه الطلبية مُرتجعة — لم يستلمها الزبون.
            </div>
          )}

          {/* Timeline */}
          {!isReturned && (
            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold text-gray-500">رحلة الطلبية</p>
              <div className="relative">
                {steps.map((s, i) => {
                  const done = !!s.ts
                  const isCurrent = i === lastDone
                  const Icon = s.icon
                  return (
                    <div key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                      {/* connector */}
                      {i < steps.length - 1 && (
                        <span
                          className={`absolute right-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${
                            steps[i + 1].ts ? 'bg-violet-400' : 'bg-gray-200'
                          }`}
                        />
                      )}
                      <div
                        className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          done
                            ? isCurrent
                              ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                              : 'bg-violet-500 text-white'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="pt-1">
                        <p
                          className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                          {s.label}
                        </p>
                        <p className="text-xs text-gray-400">{s.sub}</p>
                        {s.ts && (
                          <p className="mt-0.5 text-[11px] text-violet-500">{fmtDateTime(s.ts)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* أحداث شركة التوصيل (ECOTRACK) — من order_tracking_events */}
          {events.length > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="mb-3 text-xs font-semibold text-gray-500">تتبّع شركة التوصيل</p>
              <DeliveryTimeline events={events} />
            </div>
          )}
        </div>

        {/* Footer actions — للطلبيات بانتظار التأكيد */}
        {order.needsAction && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
            <button
              onClick={() => onReject(order.rawId)}
              disabled={busy}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
            >
              رفض
            </button>
            <button
              onClick={() => onConfirm(order.rawId)}
              disabled={busy}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-40"
            >
              {busy ? 'جارٍ…' : 'تأكيد وإرسال للتاجر'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
