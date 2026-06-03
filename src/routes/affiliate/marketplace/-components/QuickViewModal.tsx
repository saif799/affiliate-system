import { useState, useEffect } from 'react'
import { X, Copy, Check, ExternalLink, Link2 } from 'lucide-react'
import { createTrackingLink } from '../-server/marketplace.api'
import type { Product } from '../-marketplace.types'

interface Props {
  product: Product | null
  onClose: () => void
}

export function QuickViewModal({ product, onClose }: Props) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex flex-1 overflow-hidden">
          {/* ─── Left: Media ─── */}
          <div className="flex w-64 flex-col shrink-0 border-l border-gray-100 bg-gray-50">
            {/* Main image */}
            <div className="flex h-52 items-center justify-center bg-gray-100 border-b border-gray-200 overflow-hidden">
              {product.images.length > 0 ? (
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-6xl">📦</span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 p-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-10 w-10 overflow-hidden rounded-lg border transition-all ${
                      activeImage === i
                        ? 'border-violet-500 ring-1 ring-violet-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Video link */}
            {product.videoUrl && (
              <div className="flex flex-col gap-2 p-3 pt-0">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  مواد الحملة الإعلانية
                </p>
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <span className="text-sm">📹</span>
                  مشاهدة الفيديو
                  <ExternalLink size={11} className="mr-auto text-violet-300" />
                </a>
              </div>
            )}

            {/* Stats */}
            <div className="mt-auto border-t border-gray-100 p-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-green-50 p-2 text-center">
                <p className="text-sm font-bold text-green-700">
                  {product.deliveredRate}%
                </p>
                <p className="text-xs text-green-500">استلام</p>
              </div>
              <div
                className={`rounded-lg p-2 text-center ${product.retourRate > 25 ? 'bg-red-50' : 'bg-gray-50'}`}
              >
                <p
                  className={`text-sm font-bold ${product.retourRate > 25 ? 'text-red-700' : 'text-gray-700'}`}
                >
                  {product.retourRate}%
                </p>
                <p
                  className={`text-xs ${product.retourRate > 25 ? 'text-red-400' : 'text-gray-400'}`}
                >
                  روتور
                </p>
              </div>
            </div>
          </div>

          {/* ─── Right: Details + Actions ─── */}
          <div className="flex flex-1 flex-col overflow-y-auto p-5 gap-4 custom-scrollbar">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-bold text-gray-900 leading-snug">
                  {product.name}
                </h2>
                <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  {product.category}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {product.merchantName} · {product.totalSales} مبيعة
              </p>
            </div>

            {/* Base price highlight */}
            <div className="rounded-xl bg-linear-to-l from-violet-600 to-violet-500 p-4 text-white">
              <p className="text-xs text-violet-200">سعر الجملة (تكلفتك)</p>
              <p className="mt-1 text-2xl font-bold">
                {product.basePrice.toLocaleString('ar-DZ')} د.ج
              </p>
              <p className="mt-2 text-xs text-violet-200">
                بِع بأي سعر تريده — ربحك = سعر بيعك − سعر الجملة
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  وصف المنتج
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Generate Link */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="mb-3 text-xs font-semibold text-gray-700">
                🔗 توليد رابط التتبع
              </p>

              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">
                  كود التتبع SubID (اختياري)
                </label>
                <input
                  type="text"
                  value={subId}
                  onChange={(e) => {
                    setSubId(e.target.value)
                    setGeneratedUrl(null)
                  }}
                  placeholder="مثال: tiktok_v1 أو story_ad"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                />
                <p className="mt-1 text-xs text-gray-400">
                  لمعرفة مصدر كل مبيعة (تيك توك، فيسبوك...)
                </p>
              </div>

              {generatedUrl ? (
                <>
                  <div className="mb-3">
                    <label className="mb-1 block text-xs text-gray-500">
                      رابطك النهائي
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="flex-1 truncate text-xs text-gray-600 font-mono">
                        {generatedUrl}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={13} /> تم نسخ الرابط!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> نسخ الرابط
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  <Link2 size={13} />
                  {generating ? 'جارٍ التوليد...' : 'توليد الرابط'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
