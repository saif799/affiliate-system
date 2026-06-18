import { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Plus,
  Package,
  ChevronLeft,
  ChevronRight,
  Play,
  Hash,
  AlertCircle,
} from 'lucide-react'
import { createTrackingLink } from '../-server/marketplace.api'
import { LandingBuilder } from './LandingBuilder'
import type { Product } from '../-marketplace.types'

interface Props {
  product: Product | null
  onClose: () => void
  onAddOrder: (product: Product) => void
}

export function QuickViewModal({ product, onClose, onAddOrder }: Props) {
  const [subId, setSubId] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [builderOpen, setBuilderOpen] = useState(false)

  useEffect(() => {
    if (product) {
      setSubId('')
      setGeneratedUrl(null)
      setGeneratedCode(null)
      setGenError(null)
      setGenerating(false)
      setCopied(false)
      setCopiedCode(false)
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
    setGenError(null)
    try {
      const res = await createTrackingLink({
        data: { productId: product.id, subId: subId.trim() || undefined },
      })
      setGeneratedUrl(res.finalUrl)
      setGeneratedCode(res.slug)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'فشل توليد الرابط')
    } finally {
      setGenerating(false)
    }
  }

  function copy(text: string, which: 'url' | 'code') {
    navigator.clipboard.writeText(text)
    if (which === 'url') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const images = product.images.filter(Boolean)
  const hasImages = images.length > 0
  const multi = images.length > 1
  const links = product.links ?? []
  const retourDanger = product.retourRate > 25

  const go = (dir: number) =>
    setActiveImage((i) => (i + dir + images.length) % images.length)

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
        <div className="relative flex h-56 shrink-0 flex-col bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 md:h-auto md:w-[44%]">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {hasImages ? (
              <img
                src={images[activeImage]}
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

            {/* image counter */}
            {multi && (
              <span className="absolute bottom-4 left-4 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                {activeImage + 1} / {images.length}
              </span>
            )}

            {/* nav arrows */}
            {multi && (
              <>
                <button
                  onClick={() => go(1)}
                  aria-label="السابق"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => go(-1)}
                  aria-label="التالي"
                  className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
          </div>

          {/* thumbnail strip */}
          {multi && (
            <div className="custom-scrollbar flex shrink-0 gap-1.5 overflow-x-auto bg-black/15 p-2 backdrop-blur-sm">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    activeImage === i
                      ? 'border-white shadow-md'
                      : 'border-white/30 opacity-70 hover:opacity-100'
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

          {/* Description */}
          {product.description && (
            <p className="line-clamp-3 text-xs leading-relaxed text-gray-500">
              {product.description}
            </p>
          )}

          {/* Video + links */}
          {(product.videoUrl || links.length > 0) && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-600">روابط ووسائط المنتج</p>
              {product.videoUrl && (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white">
                    <Play size={12} className="ml-0.5" />
                  </span>
                  مشاهدة فيديو المنتج
                  <ExternalLink size={12} className="mr-auto text-violet-300" />
                </a>
              )}
              {links.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <Link2 size={13} className="shrink-0 text-gray-400" />
                  <span className="truncate" dir="ltr">
                    {url}
                  </span>
                  <ExternalLink size={12} className="mr-auto shrink-0 text-gray-300" />
                </a>
              ))}
            </div>
          )}

          {/* Actions — pinned to bottom */}
          <div className="mt-auto space-y-2.5 pt-1">
            {/* إنشاء صفحة بيع مخصّصة (الأبرز) */}
            <button
              onClick={() => setBuilderOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
            >
              🎨 إنشاء صفحة بيع مخصّصة (Landing)
            </button>

            {/* Generate link + code */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Link2 size={13} className="text-violet-500" /> توليد رابط وكود الربط
              </p>

              {generatedUrl ? (
                <div className="space-y-2">
                  {/* share link (لصفحة الهبوط /p) */}
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pr-3">
                    <p className="flex-1 truncate font-mono text-xs text-gray-600" dir="ltr">
                      {generatedUrl}
                    </p>
                    <button
                      onClick={() => copy(generatedUrl, 'url')}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                      }`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'نُسخ' : 'نسخ الرابط'}
                    </button>
                  </div>

                  {/* code (للمتاجر الخارجية WooCommerce/Shopify) */}
                  {generatedCode && (
                    <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 p-1.5 pr-3">
                      <Hash size={13} className="shrink-0 text-violet-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-violet-500">كود الربط للمتاجر الخارجية</p>
                        <p className="truncate font-mono text-xs font-semibold text-violet-700" dir="ltr">
                          {generatedCode}
                        </p>
                      </div>
                      <button
                        onClick={() => copy(generatedCode, 'code')}
                        className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          copiedCode ? 'bg-green-500 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                      >
                        {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                        {copiedCode ? 'نُسخ' : 'نسخ الكود'}
                      </button>
                    </div>
                  )}
                  <p className="px-0.5 text-[11px] leading-relaxed text-gray-400">
                    شارِك الرابط مباشرةً، أو ضع «كود الربط» في إضافة متجرك (WooCommerce/Shopify)
                    لِربط طلبيات متجرك بك تلقائياً.
                  </p>
                </div>
              ) : (
                <>
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
                  {genError && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle size={13} className="shrink-0" /> {genError}
                    </p>
                  )}
                </>
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

      {/* منشئ صفحة البيع */}
      <LandingBuilder
        productId={builderOpen ? product.id : null}
        onClose={() => setBuilderOpen(false)}
      />
    </div>
  )
}
