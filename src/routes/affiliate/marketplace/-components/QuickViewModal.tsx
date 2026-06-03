import { useState, useEffect } from 'react'
import { X, Copy, Check, ExternalLink, Download } from 'lucide-react'
import type { Product } from '../-marketplace.types'

interface Props {
  product: Product | null
  onClose: () => void
}

export function QuickViewModal({ product, onClose }: Props) {
  const [subId, setSubId] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedCopy, setCopiedCopy] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [activeVariant, setActiveVariant] = useState(0)

  useEffect(() => {
    if (product) {
      setSubId('')
      setCopied(false)
      setCopiedCopy(false)
      setActiveImage(0)
      setActiveVariant(0)
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

  const baseUrl = `https://affili.dz/p/${product.id}`
  const finalUrl = subId ? `${baseUrl}?sub=${subId}` : baseUrl

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCopywriting = () => {
    navigator.clipboard.writeText(product.copywriting)
    setCopiedCopy(true)
    setTimeout(() => setCopiedCopy(false), 2000)
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
            <div className="flex h-52 items-center justify-center bg-gray-100 text-6xl border-b border-gray-200">
              {product.media.images[activeImage]}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 p-3">
              {product.media.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-all ${
                    activeImage === i
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {img}
                </button>
              ))}
            </div>

            {/* Drive links */}
            <div className="flex flex-col gap-2 p-3 pt-0">
              <p className="text-xs font-medium text-gray-500 mb-1">
                مواد الحملة الإعلانية
              </p>
              <a
                href={product.media.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={13} className="text-gray-400" />
                تحميل الصور
                <ExternalLink size={11} className="mr-auto text-gray-300" />
              </a>
              {product.media.hasVideo && (
                <a
                  href={product.media.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <span className="text-sm">📹</span>
                  تحميل الفيديو
                  <ExternalLink size={11} className="mr-auto text-violet-300" />
                </a>
              )}
            </div>

            {/* Stats in modal */}
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

            {/* Commission highlight */}
            <div className="rounded-xl bg-linear-to-l from-violet-600 to-violet-500 p-4 text-white">
              <p className="text-xs text-violet-200">عمولتك لكل طلبية مستلمة</p>
              <p className="mt-1 text-2xl font-bold">
                {product.commission.toLocaleString('ar-DZ')} د.ج
              </p>
              <div className="mt-2 flex gap-3 text-xs text-violet-200">
                <span>
                  سعر البيع: {product.msrpPrice.toLocaleString('ar-DZ')} د.ج
                </span>
                <span>·</span>
                <span>
                  حد أدنى: {product.minSellingPrice.toLocaleString('ar-DZ')} د.ج
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                وصف المنتج
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variants */}
            {product.variants.length > 1 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500">
                  المتوفر
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariant(i)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                        activeVariant === i
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } ${v.stock < 10 ? 'ring-1 ring-amber-300' : ''}`}
                    >
                      {v.label}
                      {v.stock < 10 && (
                        <span className="mr-1 text-amber-400">({v.stock})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Copywriting */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-500">
                  نص تسويقي جاهز
                </p>
                <button
                  onClick={handleCopyCopywriting}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {copiedCopy ? (
                    <Check size={11} className="text-green-500" />
                  ) : (
                    <Copy size={11} />
                  )}
                  {copiedCopy ? 'تم النسخ!' : 'نسخ'}
                </button>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed">
                  {product.copywriting}
                </pre>
              </div>
            </div>

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
                  onChange={(e) => setSubId(e.target.value)}
                  placeholder="مثال: tiktok_v1 أو story_ad"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                />
                <p className="mt-1 text-xs text-gray-400">
                  لمعرفة مصدر كل مبيعة (تيك توك، فيسبوك...)
                </p>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">
                  رابطك النهائي
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="flex-1 truncate text-xs text-gray-600 font-mono">
                    {finalUrl}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
