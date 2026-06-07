import { useEffect, useMemo } from 'react'
import { X, Printer } from 'lucide-react'

export interface PrintedLabel {
  internalShipmentId: string
  pdfBase64: string
}

function base64ToBlobUrl(b64: string): string {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

// عارض/طابع الملصقات الرسمية (PDF من ECOTRACK) — للأدمن فقط.
export function LabelPrintView({
  labels,
  onClose,
}: {
  labels: PrintedLabel[]
  onClose: () => void
}) {
  const urls = useMemo(
    () => labels.map((l) => ({ id: l.internalShipmentId, url: base64ToBlobUrl(l.pdfBase64) })),
    [labels],
  )

  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u.url)), [urls])

  if (labels.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl" dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            الملصقات الرسمية ({labels.length})
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {urls.map((u) => (
            <div key={u.id} className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                <span className="font-mono text-xs text-gray-600">{u.id}</span>
                <a
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  <Printer size={13} /> فتح / طباعة
                </a>
              </div>
              <iframe title={u.id} src={u.url} className="h-[60vh] w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
