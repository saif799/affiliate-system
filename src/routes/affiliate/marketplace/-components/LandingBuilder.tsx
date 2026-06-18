'use client'

// منشئ «صفحة البيع» للمسوّق: يضبط السعر، العنوان، الوصف، الصور (اختيار صور التاجر
// أو رفع صوره)، التوصيل المجاني، ولون التمييز — ثم ينشر الصفحة ويحصل على رابطها وكودها.

import { useEffect, useState } from 'react'
import {
  X, Check, Copy, Upload, Eye, Loader2, Truck, Hash, ExternalLink,
} from 'lucide-react'
import {
  getLandingConfig,
  saveLanding,
  uploadLandingImage,
  type LandingConfig,
} from '../-server/landings.api'

const ACCENTS = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#ea580c', '#db2777', '#0891b2', '#0f172a']

interface Props {
  productId: string | null
  onClose: () => void
}

export function LandingBuilder({ productId, onClose }: Props) {
  const [cfg, setCfg] = useState<LandingConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form
  const [salePrice, setSalePrice] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [available, setAvailable] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [freeOffice, setFreeOffice] = useState(false)
  const [freeHome, setFreeHome] = useState(false)
  const [accent, setAccent] = useState('#7c3aed')

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState<{ url: string; slug: string } | null>(null)
  const [copied, setCopied] = useState<'url' | 'code' | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    setError(null)
    setPublished(null)
    getLandingConfig({ data: { productId } })
      .then((c) => {
        setCfg(c)
        setSalePrice(c.salePrice)
        setTitle(c.title)
        setDescription(c.description)
        setAvailable([...new Set([...c.productImages, ...c.images])])
        setImages(c.images)
        setFreeOffice(c.freeOffice)
        setFreeHome(c.freeHome)
        setAccent(c.accent)
        if (c.enabled && c.finalUrl && c.slug) setPublished({ url: c.finalUrl, slug: c.slug })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'تعذّر تحميل الإعدادات'))
      .finally(() => setLoading(false))
  }, [productId])

  if (!productId) return null

  const toggleImage = (url: string) =>
    setImages((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]))

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('images', f))
      const res = await uploadLandingImage({ data: fd })
      setAvailable((prev) => [...prev, ...res.urls])
      setImages((prev) => [...prev, ...res.urls])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل رفع الصور')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!productId || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await saveLanding({
        data: {
          productId,
          salePrice: Math.round(salePrice),
          title: title.trim(),
          description: description.trim(),
          images,
          freeOffice,
          freeHome,
          accent,
        },
      })
      setPublished({ url: res.finalUrl, slug: res.slug })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر حفظ الصفحة')
    } finally {
      setSaving(false)
    }
  }

  function copy(text: string, which: 'url' | 'code') {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1800)
  }

  const estProfit = cfg ? salePrice - cfg.minPrice : 0

  return (
    <div
      className="qv-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="qv-card custom-scrollbar flex max-h-[92vh] w-full max-w-xl flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 text-white"
          style={{ background: `linear-gradient(to left, ${accent}, ${accent}cc)` }}
        >
          <div>
            <h2 className="text-base font-bold">صفحة البيع</h2>
            <p className="text-xs text-white/80">{cfg?.productName ?? '...'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
        </div>

        {loading || !cfg ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5">
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            {/* السعر */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                سعر البيع لكل قطعة (د.ج)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  الجملة {cfg.basePrice.toLocaleString('ar-DZ')} · أدنى سعر{' '}
                  {cfg.minPrice.toLocaleString('ar-DZ')} د.ج
                </span>
                <span className={estProfit >= 0 ? 'font-semibold text-green-600' : 'text-red-500'}>
                  ربحك ≈ {estProfit.toLocaleString('ar-DZ')} د.ج
                  {(freeOffice || freeHome) && (
                    <span className="font-normal text-gray-400"> (قبل خصم التوصيل المجاني)</span>
                  )}
                </span>
              </div>
            </div>

            {/* العنوان */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">عنوان الصفحة</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </div>

            {/* الوصف */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                الوصف (نصّ البيع)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="اكتب وصفاً جذّاباً يُقنع الزبون بالشراء..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </div>

            {/* الصور */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                صور الصفحة (اختر من صور التاجر أو ارفع صورك)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {available.map((url) => {
                  const sel = images.includes(url)
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => toggleImage(url)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                        sel ? 'border-violet-500' : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {sel && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white">
                          <Check size={10} />
                        </span>
                      )}
                    </button>
                  )
                })}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-violet-400 hover:bg-violet-50">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span className="text-[10px]">رفع</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleUpload(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">{images.length} صورة مختارة</p>
            </div>

            {/* التوصيل المجاني */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Truck size={13} className="text-violet-500" /> التوصيل المجاني (تتحمّله من ربحك)
              </p>
              <div className="flex gap-2">
                <Toggle label="مجاني للمكتب" on={freeOffice} onClick={() => setFreeOffice((v) => !v)} />
                <Toggle label="مجاني للمنزل" on={freeHome} onClick={() => setFreeHome((v) => !v)} />
              </div>
            </div>

            {/* اللون */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">لون الصفحة</label>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccent(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${accent === c ? 'ring-2 ring-offset-2' : ''}`}
                    style={{ backgroundColor: c, ...(accent === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* النشر + الرابط */}
            {published && (
              <div className="space-y-2 rounded-xl border border-green-100 bg-green-50/60 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                  <Check size={13} /> الصفحة منشورة
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 pr-3">
                  <p className="flex-1 truncate font-mono text-xs text-gray-600" dir="ltr">{published.url}</p>
                  <button
                    onClick={() => copy(published.url, 'url')}
                    className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${copied === 'url' ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'}`}
                  >
                    {copied === 'url' ? <Check size={11} /> : <Copy size={11} />} نسخ
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-white p-1.5 pr-3">
                  <Hash size={12} className="shrink-0 text-violet-400" />
                  <p className="flex-1 truncate font-mono text-xs text-violet-700" dir="ltr">{published.slug}</p>
                  <span className="text-[10px] text-gray-400">كود الإضافة</span>
                  <button
                    onClick={() => copy(published.slug, 'code')}
                    className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${copied === 'code' ? 'bg-green-500 text-white' : 'bg-violet-600 text-white'}`}
                  >
                    {copied === 'code' ? <Check size={11} /> : <Copy size={11} />} نسخ
                  </button>
                </div>
                <a
                  href={published.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Eye size={13} /> معاينة الصفحة <ExternalLink size={11} className="text-gray-400" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && cfg && (
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              إغلاق
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {published ? 'حفظ التعديلات ونشر' : 'نشر الصفحة'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
        on
          ? 'border-violet-300 bg-violet-100 text-violet-700'
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${on ? 'bg-violet-600 text-white' : 'border border-gray-300'}`}
      >
        {on && <Check size={10} />}
      </span>
      {label}
    </button>
  )
}
