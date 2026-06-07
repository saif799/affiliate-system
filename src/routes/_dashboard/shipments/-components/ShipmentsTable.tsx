import { Loader2, Printer, CheckCircle2 } from 'lucide-react'
import type { ShipmentView } from '../-server/shipments.api'

const STATUS: Record<string, { label: string; cls: string }> = {
  shipped: { label: 'مشحونة', cls: 'bg-blue-100 text-blue-700' },
  at_wilaya: { label: 'في الولاية', cls: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'مُسلَّمة', cls: 'bg-green-100 text-green-700' },
  returned: { label: 'مرتجعة', cls: 'bg-red-100 text-red-700' },
}

interface Props {
  shipments: ShipmentView[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  onPrint: (id: string) => void
  busyId: string | null
}

export function ShipmentsTable({
  shipments,
  selectedIds,
  onToggle,
  onToggleAll,
  onPrint,
  busyId,
}: Props) {
  // الطباعة الجماعية لا تشمل المطبوعة سلفاً
  const printableIds = shipments.filter((s) => !s.labelPrintedAt).map((s) => s.id)
  const allSelected = printableIds.length > 0 && printableIds.every((id) => selectedIds.has(id))

  if (shipments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-400">لا توجد شحنات</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-right text-xs font-medium text-gray-500">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onToggleAll(allSelected ? [] : printableIds)}
                className="h-3.5 w-3.5 cursor-pointer rounded"
              />
            </th>
            <th className="px-4 py-3">مرجع الشحنة</th>
            <th className="px-4 py-3">التاجر</th>
            <th className="px-4 py-3">الولاية</th>
            <th className="px-4 py-3">التوصيل</th>
            <th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">الملصق</th>
            <th className="px-4 py-3">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => {
            const st = STATUS[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-600' }
            const busy = busyId === s.id
            const printed = !!s.labelPrintedAt
            return (
              <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    disabled={printed}
                    onChange={() => onToggle(s.id)}
                    className="h-3.5 w-3.5 cursor-pointer rounded disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-800">
                  {s.internalShipmentId ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{s.merchantName}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{s.wilaya}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {s.deliveryType === 'office' ? `مكتب${s.officeName ? ` — ${s.officeName}` : ''}` : 'منزل'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
                    {st.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {printed ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={13} /> طُبع
                    </span>
                  ) : (
                    <span className="text-gray-400">بانتظار الطباعة</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onPrint(s.id)}
                    disabled={busy || printed}
                    title={printed ? 'طُبع مسبقاً (استخدام واحد)' : 'طباعة الملصق الرسمي'}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                    طباعة
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
