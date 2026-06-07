import { Loader2, Truck, X } from 'lucide-react'
import type { Order } from '../-orders.types'

interface Props {
  order: Order | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}

// نافذة تأكيد الشحن (Phase 4) — تعرض ملخّص الطلبية قبل إنشاء الشحنة لدى الناقل.
// زرّ التأكيد يُعطَّل أثناء التنفيذ (منع النقر المزدوج) — والخادم آمن للتزامن أصلاً.
export function ShipConfirmModal({ order, busy, onConfirm, onCancel }: Props) {
  if (!order) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl" dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Truck size={16} className="text-blue-500" /> تأكيد شحن الطلبية
          </h2>
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-xs">
          <p className="text-gray-500">
            سيتم إنشاء الشحنة لدى شركة التوصيل وجلب رقم التتبّع تلقائياً.
          </p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <Row label="المنتج" value={order.product.name} />
            <Row label="الكمية" value={String(order.quantity)} />
            <Row label="الولاية" value={order.wilaya} />
            <Row
              label="نوع التوصيل"
              value={order.deliveryType === 'office' ? 'مكتب (Stop Desk)' : 'منزل'}
            />
            {order.deliveryType === 'office' && order.officeName && (
              <Row label="المكتب" value={order.officeName} />
            )}
            <Row
              label="مبلغ التحصيل (COD)"
              value={`${order.totalPrice.toLocaleString('ar-DZ')} د.ج`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'جارٍ الشحن...' : 'تأكيد وشحن'}
          </button>
        </div>
      </div>
    </div>
  )
}
