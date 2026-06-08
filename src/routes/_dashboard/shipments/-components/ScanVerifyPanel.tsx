// admin: scan a merchant internal-label QR → match shipment → verify at provider.
// QR content is the signed HMAC token. Camera scan uses the native BarcodeDetector
// (Chromium) when available; manual entry (USB scanner / paste) always works.
import { useRef, useState } from 'react'
import { Loader2, QrCode, Camera, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { verifyShipmentByQr, confirmShipmentReceived } from '../-server/shipments.api'
import type { ScanMatchResult, ConfirmReceptionResult } from '../-server/shipments.api'

const REASON_AR: Record<string, string> = {
  malformed: 'رمز غير صالح (تالف)',
  invalid_signature: 'توقيع غير صالح — رمز غير موثوق',
  expired: 'انتهت صلاحية الرمز (72 ساعة)',
  not_found: 'لا توجد شحنة مطابقة لهذا الرمز',
}

export function ScanVerifyPanel() {
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [result, setResult] = useState<ScanMatchResult | null>(null)
  const [reception, setReception] = useState<ConfirmReceptionResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function verify(tok: string) {
    const t = tok.trim()
    if (!t) return
    setBusy(true)
    setReception(null)
    try {
      setResult(await verifyShipmentByQr({ data: { token: t } }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'فشل التحقّق')
    } finally {
      setBusy(false)
    }
  }

  async function confirm(orderId: string) {
    setConfirmBusy(true)
    try {
      setReception(await confirmShipmentReceived({ data: { orderId } }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'فشل تأكيد الاستلام')
    } finally {
      setConfirmBusy(false)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
    setScanning(false)
  }

  async function startCamera() {
    const Detector = (globalThis as any).BarcodeDetector
    if (!Detector) {
      alert('متصفّحك لا يدعم المسح بالكاميرا — الصق محتوى الرمز يدويّاً')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      const detector = new Detector({ formats: ['qr_code'] })
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      const tick = async () => {
        if (!streamRef.current) return
        try {
          const codes = await detector.detect(video)
          if (codes.length > 0 && codes[0].rawValue) {
            const val = codes[0].rawValue as string
            setToken(val)
            stopCamera()
            await verify(val)
            return
          }
        } catch {
          /* transient detect error — keep scanning */
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } catch {
      alert('تعذّر فتح الكاميرا')
      stopCamera()
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <QrCode size={16} className="text-gray-700" />
        <h2 className="text-sm font-bold text-gray-900">مسح رمز QR ومطابقة الشحنة</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && verify(token)}
          placeholder="امسح الرمز أو الصق محتواه هنا…"
          className="min-w-[260px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-gray-400"
          dir="ltr"
        />
        <button
          onClick={() => verify(token)}
          disabled={busy || !token.trim()}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
          تحقّق
        </button>
        <button
          onClick={scanning ? stopCamera : startCamera}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          <Camera size={15} />
          {scanning ? 'إيقاف الكاميرا' : 'مسح بالكاميرا'}
        </button>
      </div>

      {scanning && (
        <video ref={videoRef} className="mt-3 w-full max-w-sm rounded-lg border border-gray-200" muted playsInline />
      )}

      {result && !result.matched && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <XCircle size={15} />
          {REASON_AR[result.reason ?? ''] ?? 'فشل المطابقة'}
        </div>
      )}

      {result?.matched && result.order && (
        <div className="mt-3 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={15} /> تطابقت الشحنة
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
            <dt className="text-gray-400">المرجع الداخلي</dt>
            <dd className="font-mono">{result.order.internalShipmentId}</dd>
            <dt className="text-gray-400">التاجر</dt>
            <dd>{result.order.merchantName}</dd>
            <dt className="text-gray-400">الولاية</dt>
            <dd>{result.order.wilaya}{result.order.officeName ? ` — ${result.order.officeName}` : ''}</dd>
            <dt className="text-gray-400">رقم التتبّع</dt>
            <dd className="font-mono" dir="ltr">{result.order.trackingNumber ?? '—'}</dd>
            <dt className="text-gray-400">حالة المنصّة</dt>
            <dd>{result.order.status}</dd>
            <dt className="text-gray-400">لدى شركة التوصيل</dt>
            <dd>
              {result.provider?.exists
                ? `موجودة ✓ ${result.provider.statusLabel ? `— ${result.provider.statusLabel}` : ''}`
                : 'تعذّر التأكيد من المزوّد'}
            </dd>
          </dl>

          <button
            onClick={() => result.order && confirm(result.order.id)}
            disabled={confirmBusy || !result.order.trackingNumber}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {confirmBusy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            تأكيد الاستلام (مزامنة من شركة التوصيل)
          </button>

          {reception && (
            <div className="rounded-lg bg-white px-3 py-2 text-xs text-gray-700">
              الحالة الحقيقية من المزوّد: <strong>{reception.deliveryStatusLabel ?? reception.deliveryStatus ?? '—'}</strong>
              {' '}· حالة المنصّة: <strong>{reception.status}</strong>
              {' '}· أحداث مُطبَّقة: {reception.eventsApplied}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
