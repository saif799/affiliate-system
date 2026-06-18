// merchant/products/-components/AddProductDrawer.tsx

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Upload, Trash2, Link2, Plus, Info } from 'lucide-react'
import { uploadProductImages } from '../-server/products.api'
import type { Product, ProductFormData, ProductCategory } from '../-products.types'

const CATEGORIES: ProductCategory[] = ['أحذية', 'ملابس', 'حقائب', 'إلكترونيات', 'أخرى']

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  category: 'أحذية',
  stockQuantity: 0,
  lowStockThreshold: 10,
  basePrice: 0,
  images: [],
  videoUrl: '',
  links: [],
}

const steps = ['المعلومات الأساسية', 'التسعير والمخزون', 'الصور والروابط']
const MAX_IMAGES = 5
const MAX_LINKS = 6

interface AddProductDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => void | Promise<void>
  editData?: Product | null
}

export function AddProductDrawer({
  isOpen,
  onClose,
  onSubmit,
  editData,
}: AddProductDrawerProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // تحديث الـ form عند فتح التعديل
  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name,
        description: editData.description ?? '',
        category: editData.category,
        stockQuantity: editData.stockQuantity,
        lowStockThreshold: editData.lowStockThreshold,
        basePrice: editData.basePrice,
        images: editData.images,
        videoUrl: editData.videoUrl ?? '',
        links: editData.links ?? [],
      })
      setExistingImages(editData.images)
    } else {
      setForm(EMPTY_FORM)
      setExistingImages([])
    }
    setFiles([])
    setError('')
    setStep(0)
  }, [editData, isOpen])

  const set = (field: keyof ProductFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setLink = (idx: number, value: string) =>
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((l, i) => (i === idx ? value : l)),
    }))
  const addLink = () =>
    setForm((prev) =>
      prev.links.length < MAX_LINKS ? { ...prev, links: [...prev.links, ''] } : prev,
    )
  const removeLink = (idx: number) =>
    setForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }))

  const totalImages = existingImages.length + files.length

  const handleSelectFiles = (selected: FileList | null) => {
    if (!selected) return
    const picked = Array.from(selected)
    if (existingImages.length + files.length + picked.length > MAX_IMAGES) {
      setError(`الحد الأقصى ${MAX_IMAGES} صور`)
      return
    }
    const invalid = picked.find((f) => !f.type.startsWith('image/'))
    if (invalid) {
      setError('الملف يجب أن يكون صورة')
      return
    }
    setError('')
    setFiles((prev) => [...prev, ...picked])
  }

  const removeExisting = (url: string) =>
    setExistingImages((prev) => prev.filter((u) => u !== url))

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleClose = () => {
    setStep(0)
    setForm(EMPTY_FORM)
    setExistingImages([])
    setFiles([])
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      let uploadedUrls: string[] = []
      if (files.length > 0) {
        const fd = new FormData()
        files.forEach((f) => fd.append('images', f))
        const res = await uploadProductImages({ data: fd })
        uploadedUrls = res.urls
      }
      const images = [...existingImages, ...uploadedUrls].slice(0, MAX_IMAGES)
      const links = form.links.map((l) => l.trim()).filter(Boolean)
      await onSubmit({ ...form, images, videoUrl: form.videoUrl.trim(), links })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ المنتج')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isEditing = !!editData

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-105 flex-col border-l border-gray-200 bg-white">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </p>
            <p className="text-xs text-gray-400">
              الخطوة {step + 1} من {steps.length}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center border-b border-gray-100 px-5 py-3">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i <= step ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${
                  i === step ? 'font-medium text-gray-800' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-3 h-px w-8 ${i < step ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* ─── الخطوة 1: المعلومات الأساسية ─── */}
          {step === 0 && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  اسم المنتج *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="مثال: حذاء رياضي أبيض"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  وصف المنتج
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="وصف جذاب يساعد المسوقين على البيع..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  الفئة *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ─── الخطوة 2: التسعير والمخزون ─── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    الكمية المتوفرة *
                  </label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => set('stockQuantity', Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    عتبة التحذير
                  </label>
                  <input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => set('lowStockThreshold', Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  سعر الجملة (ما ستقبضه) — DZD *
                </label>
                <input
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => set('basePrice', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                />
              </div>
            </>
          )}

          {/* ─── الخطوة 3: الصور ─── */}
          {step === 2 && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  صور المنتج (أقصى {MAX_IMAGES} صور — الأولى هي الصورة الرئيسية)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((url) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeExisting(url)}
                        className="absolute top-1 left-1 rounded-md bg-black/50 p-1 text-white hover:bg-black/70"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                  {files.map((file, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 left-1 rounded-md bg-black/50 p-1 text-white hover:bg-black/70"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                  {totalImages < MAX_IMAGES && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:bg-gray-50">
                      <Upload size={16} />
                      <span className="text-xs">رفع</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleSelectFiles(e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {totalImages}/{MAX_IMAGES} صور • أقل من 5MB لكل صورة
                </p>
              </div>

              {/* تنويه: روابط فقط — لا رفع فيديو على المنصة */}
              <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <p className="text-xs leading-relaxed text-blue-800">
                  تنويه: المنصة لا تستضيف رفع الفيديوهات — تضع <strong>روابط فقط</strong>{' '}
                  (يوتيوب، فيسبوك، تيكتوك…) لفيديوهات أو صفحات لها علاقة بهذا المنتج.
                </p>
              </div>

              {/* رابط الفيديو الرئيسي (رابط خارجي فقط) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  رابط الفيديو الرئيسي للمنتج (اختياري)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={form.videoUrl}
                  onChange={(e) => set('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  رابط فقط — يظهر للمسوّق كزرّ «مشاهدة الفيديو» البارز في صفحة المنتج.
                </p>
              </div>

              {/* روابط أخرى ذات صلة */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  روابط أخرى ذات صلة بالمنتج — حتى {MAX_LINKS}
                </label>
                <div className="space-y-2">
                  {form.links.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Link2 size={13} className="shrink-0 text-gray-400" />
                      <input
                        type="url"
                        dir="ltr"
                        value={link}
                        onChange={(e) => setLink(idx, e.target.value)}
                        placeholder="https://..."
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(idx)}
                        className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="حذف الرابط"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {form.links.length < MAX_LINKS && (
                    <button
                      type="button"
                      onClick={addLink}
                      className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50"
                    >
                      <Plus size={13} /> إضافة رابط
                    </button>
                  )}
                </div>
              </div>

              {/* ملخص قبل الحفظ */}
              <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600">ملخص المنتج</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">الاسم</span>
                  <span className="font-medium text-gray-800">{form.name || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">الفئة</span>
                  <span className="text-gray-800">{form.category}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">الكمية</span>
                  <span className="text-gray-800">{form.stockQuantity} وحدة</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">سعر الجملة</span>
                  <span className="font-semibold text-gray-800">
                    {form.basePrice.toLocaleString('ar-DZ')} DZD
                  </span>
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={13} />
            السابق
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !form.name}
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              التالي
              <ChevronLeft size={13} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting
                ? 'جارٍ الحفظ...'
                : isEditing
                  ? 'حفظ التعديلات ✓'
                  : 'حفظ المنتج ✓'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
