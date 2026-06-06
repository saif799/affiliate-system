import { useState, useEffect } from 'react'
import { X, Copy, Check, ExternalLink, Link2, Plus, Package } from 'lucide-react'
import { createTrackingLink } from '../-server/marketplace.api'
import type { Product } from '../-marketplace.types'

interface Props {
  product: Product | null
  onClose: () => void
  onAddOrder: (product: Product) => void
}

export function QuickViewModal({ product, onClose, onAddOrder }: Props) {
  const [subId, setSubId] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (product) {
      setSubId('')
      setGeneratedUrl(null)
      setGenerating(false)
      setCopied(false)
      setActiveImage(0)
    }
  }, [product])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!product) return null

  async function handleGenerate() {
    if (!product) return
    setGenerating(true)
    try {
      const res = await createTrackingLink({
        data: { productId: product.id, subId: subId.trim() || undefined },
      })
      setGeneratedUrl(res.finalUrl)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل توليد الرابط')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopyLink() {
    if (!generatedUrl) return
    navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasImages = product.images.length > 0
  const retourDanger = product.retourRate > 25

  return (
    <div
      className="qv-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="qv-card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-md ring-1 ring-black/5 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <X size={15} />
        </button>

        {/* ── Media panel ── */}
        <div className="relative h-52 shrink-0 overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 md:h-auto md:w-2/5">
          {hasImages ? (
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-violet-900/40 blur-2xl" />
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/10 ring-1 ring-white/25 backdrop-blur-sm">
                  <Package size={46} className="text-white/85" strokeWidth={1.3} />
                </div>
              </div>
            </>
          )}

          {/* category badge */}
          <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
            {product.category}
          </span>

          {/* thumbnails */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-9 w-9 overflow-hidden rounded-lg border-2 transition-all ${
                    activeImage === i
                      ? 'border-white shadow-md'
                      : 'border-white/40 hover:border-white/70'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details panel ── */}
        <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {/* Header */}
          <div className="pl-9">
            <h2 className="text-xl font-bold leading-snug text-gray-900">{product.name}</h2>
            <p className="mt-1 text-xs text-gray-400">
              {product.merchantName} · {product.totalSales.toLocaleString('ar-DZ')} مبيعة
            </p>
          </div>

          {/* Price hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-violet-600 to-indigo-500 p-4 text-white shadow-sm">
            <div className="absolute -left-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex items-center justify-between">
              <p className="text-xs font-medium text-violet-100">سعر الجملة (تكلفتك)</p>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur">
                بِع بأي سعر
              </span>
            </div>
            <p className="relative mt-1 text-3xl font-extrabold tracking-tight">
              {product.basePrice.toLocaleString('ar-DZ')}{' '}
              <span className="text-base font-bold text-violet-100">د.ج</span>
            </p>
            <p className="relative mt-1 text-xs text-violet-100">ربحك = سعر بيعك − سعر الجملة</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-green-50 py-2.5 text-center">
              <p className="text-lg font-bold text-green-600">{product.deliveredRate}%</p>
              <p className="text-xs text-green-500">استلام</p>
            </div>
            <div className={`rounded-xl py-2.5 text-center ${retourDanger ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className={`text-lg font-bold ${retourDanger ? 'text-red-600' : 'text-gray-700'}`}>
                {product.retourRate}%
              </p>
              <p className={`text-xs ${retourDanger ? 'text-red-400' : 'text-gray-400'}`}>روتور</p>
            </div>
            <div className="rounded-xl bg-violet-50 py-2.5 text-center">
              <p className="text-lg font-bold text-violet-600">
                {product.totalSales.toLocaleString('ar-DZ')}
              </p>
              <p className="text-xs text-violet-400">مبيعة</p>
            </div>
          </div>

          {/* Description + video */}
          {product.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
              {product.description}
            </p>
          )}
          {product.videoUrl && (
            <a
              href={product.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium text-violet-600 transition-colors hover:text-violet-800"
            >
              <span>📹</span> مشاهدة فيديو الحملة
              <ExternalLink size={12} className="text-violet-300" />
            </a>
          )}

          {/* Actions — pinned to bottom */}
          <div className="mt-auto space-y-2.5 pt-1">
            {/* Generate link */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Link2 size={13} className="text-violet-500" /> توليد رابط التتبع
              </p>
              {generatedUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pr-3">
                  <p className="flex-1 truncate font-mono text-xs text-gray-600">{generatedUrl}</p>
                  <button
                    onClick={handleCopyLink}
                    className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                    }`}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'نُسخ' : 'نسخ'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subId}
                    onChange={(e) => {
                      setSubId(e.target.value)
                      setGeneratedUrl(null)
                    }}
                    placeholder="SubID اختياري (tiktok_v1)"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-700 disabled:bg-violet-300"
                  >
                    <Link2 size={13} />
                    {generating ? '...' : 'توليد'}
                  </button>
                </div>
              )}
            </div>

            {/* Add manual order */}
            <button
              onClick={() => onAddOrder(product)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-900 bg-white py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              <Plus size={15} /> إضافة طلبية يدوية لهذا المنتج
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
