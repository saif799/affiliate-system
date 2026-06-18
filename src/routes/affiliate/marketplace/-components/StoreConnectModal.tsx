'use client'

// نافذة «ربط متجرك الخارجي» للمسوّق: تعرض مفتاح الاستيراد + رابط النقطة + دليل
// مختصر لإضافة متجره (WooCommerce/Shopify) كي تلتقط الـextension طلبيات متجره
// وتربطها به عبر «كود الربط» الذي يولّده لكل منتج من السوق.

import { useEffect, useState } from 'react'
import { X, Copy, Check, KeyRound, RefreshCw, ShieldAlert } from 'lucide-react'
import { getOrCreateIngestKey } from '../-server/landings.api'
import { ConfirmDialog } from '#/routes/-components/shared/ConfirmDialog'

interface Props {
  open: boolean
  onClose: () => void
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1.5 pr-3">
        <code className="flex-1 truncate font-mono text-xs text-gray-700" dir="ltr">
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          }}
          className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'نُسخ' : 'نسخ'}
        </button>
      </div>
    </div>
  )
}

export function StoreConnectModal({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [ingestUrl, setIngestUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    getOrCreateIngestKey({ data: {} })
      .then((r) => {
        setApiKey(r.apiKey)
        setIngestUrl(r.ingestUrl || '/api/ingest/order')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'تعذّر جلب المفتاح'))
      .finally(() => setLoading(false))
  }, [open])

  async function doRegenerate() {
    setConfirmOpen(false)
    setLoading(true)
    setError(null)
    try {
      const r = await getOrCreateIngestKey({ data: { regenerate: true } })
      setApiKey(r.apiKey)
      setIngestUrl(r.ingestUrl || '/api/ingest/order')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر إعادة التوليد')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="qv-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="qv-card custom-scrollbar flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-l from-violet-700 to-violet-500 px-5 py-4 text-white">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-2">
            <KeyRound size={18} />
            <h2 className="text-base font-bold">ربط متجرك الخارجي</h2>
          </div>
          <p className="mt-1 text-xs text-violet-100">
            التقط طلبيات متجرك (WooCommerce / Shopify) واربطها تلقائياً بك وبالمنتج
          </p>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          {loading && !apiKey ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-violet-600" />
            </div>
          ) : (
            apiKey && (
              <>
                <CopyField label="مفتاح الاستيراد (x-api-key)" value={apiKey} />
                <CopyField label="رابط النقطة (POST)" value={ingestUrl || '/api/ingest/order'} />

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    احتفظ بالمفتاح سرّياً — يُستخدم في الـextension على خادم متجرك فقط. لا تضعه في كود
                    واجهة المتجر العلني.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={13} /> إعادة توليد المفتاح
                </button>
              </>
            )
          )}

          {/* دليل التكامل المختصر */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold text-gray-700">كيف يعمل الربط؟</p>
            <ol className="list-decimal space-y-1.5 pr-4 text-xs leading-relaxed text-gray-500">
              <li>ولّد «كود الربط» لكل منتج تريد بيعه من سوق المنتجات (حقل code).</li>
              <li>
                في إضافة متجرك، عند كل طلب جديد أرسل طلب{' '}
                <code className="rounded bg-white px-1 font-mono text-[11px] text-gray-700">POST</code>{' '}
                إلى رابط النقطة مع ترويسة{' '}
                <code className="rounded bg-white px-1 font-mono text-[11px] text-gray-700">
                  x-api-key
                </code>
                .
              </li>
              <li>
                الجسم (JSON):{' '}
                <code className="rounded bg-white px-1 font-mono text-[11px] text-gray-700" dir="ltr">
                  {'{ code, externalOrderId, customer:{name,phone,wilaya}, salePrice }'}
                </code>
              </li>
              <li>تظهر الطلبية فوراً في «طلبياتي» بانتظار تأكيدك، مربوطةً بك وبتاجر المنتج.</li>
            </ol>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        variant="danger"
        title="إعادة توليد المفتاح؟"
        message="سيُبطَل المفتاح الحالي فوراً، وأي متجر مربوط به سيتوقّف حتى تُحدّث المفتاح فيه."
        confirmLabel="نعم، أعِد التوليد"
        loading={loading}
        onConfirm={doRegenerate}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
