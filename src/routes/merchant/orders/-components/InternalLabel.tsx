import { useEffect, useState } from 'react'
import { X, Printer, Loader2 } from 'lucide-react'
import { getInternalLabel  } from '../-server/orders.api'
import type {InternalLabelData} from '../-server/orders.api';

function deliveryLabel(d: InternalLabelData): string {
  if (d.deliveryType === 'office') return `مكتب${d.officeName ? ` — ${d.officeName}` : ''}`
  return 'منزل'
}

// طباعة الملصق في نافذة مستقلّة (لا يطبع لوحة التحكّم كلّها)
function printLabel(d: InternalLabelData) {
  const w = window.open('', '_blank', 'width=420,height=620')
  if (!w) return
  const created = new Date(d.createdAt).toLocaleString('ar-DZ')
  w.document.body.innerHTML = `
    <div style="font-family:sans-serif;text-align:center;padding:16px" dir="rtl">
      <div style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:1px">${d.internalShipmentId}</div>
      <img src="${d.qrDataUrl}" alt="QR" style="width:220px;height:220px;margin:12px auto" />
      <div style="font-size:14px;margin:4px 0">${deliveryLabel(d)}</div>
      <div style="font-size:14px;margin:4px 0">${d.wilaya}</div>
      <div style="font-size:12px;color:#666;margin-top:8px">${created}</div>
    </div>`
  w.document.title = d.internalShipmentId
  w.focus()
  w.print()
}

export function InternalLabel({
  orderId,
  onClose,
}: {
  orderId: string | null
  onClose: () => void
}) {
  const [data, setData] = useState<InternalLabelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    setData(null)
    getInternalLabel({ data: { orderId } })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'تعذّر تحميل الملصق')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  if (!orderId) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl" dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">الملصق الداخلي</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" /> جارٍ التحميل...
            </div>
          ) : error ? (
            <p className="py-6 text-center text-xs text-red-500">{error}</p>
          ) : data ? (
            <>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <div className="font-mono text-lg font-bold tracking-wide text-gray-900">
                  {data.internalShipmentId}
                </div>
                <img
                  src={data.qrDataUrl}
                  alt="QR"
                  className="mx-auto my-3 h-44 w-44"
                />
                <div className="text-xs text-gray-700">{deliveryLabel(data)}</div>
                <div className="text-xs text-gray-700">{data.wilaya}</div>
                <div className="mt-1 text-[11px] text-gray-400">
                  {new Date(data.createdAt).toLocaleString('ar-DZ')}
                </div>
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                الملصق الداخلي لا يحوي بيانات الزبون ولا بيانات شركة التوصيل. الصِقه على الطرد.
              </p>
              <button
                onClick={() => printLabel(data)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700"
              >
                <Printer size={14} /> طباعة الملصق
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
