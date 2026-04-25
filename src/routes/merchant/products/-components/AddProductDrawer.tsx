// merchant/products/-components/AddProductDrawer.tsx

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product, ProductFormData, ProductCategory } from '../products.types'

const CATEGORIES: ProductCategory[] = ['أحذية', 'ملابس', 'حقائب', 'إلكترونيات', 'أخرى']

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  category: 'أحذية',
  sku: '',
  stockQuantity: 0,
  lowStockThreshold: 10,
  basePrice: 0,
  msrpPrice: 0,
  minSellingPrice: 0,
  thumbnail: '📦',
  mediaFolderUrl: '',
}

const steps = ['المعلومات الأساسية', 'التسعير والمخزون', 'الميديا والتسويق']

interface AddProductDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => void
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

  // تحديث الـ form عند فتح التعديل
  useEffect(() => {
    if (editData) {
      setForm({
        name:              editData.name,
        description:       editData.description ?? '',
        category:          editData.category,
        sku:               editData.sku,
        stockQuantity:     editData.stockQuantity,
        lowStockThreshold: editData.lowStockThreshold,
        basePrice:         editData.basePrice,
        msrpPrice:         editData.msrpPrice,
        minSellingPrice:   editData.minSellingPrice,
        thumbnail:         editData.thumbnail,
        mediaFolderUrl:    editData.mediaFolderUrl ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setStep(0)
  }, [editData])

  const set = (field: keyof ProductFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleClose = () => {
    setStep(0)
    setForm(EMPTY_FORM)
    onClose()
  }

  const handleSubmit = () => {
    onSubmit(form)
    handleClose()
  }

  if (!isOpen) return null

  const isEditing = !!editData

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={handleClose}
      />

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
                  i < step   ? 'bg-gray-900 text-white' :
                  i === step ? 'bg-gray-900 text-white' :
                               'bg-gray-100 text-gray-400'
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
                <div className={`mx-3 h-px w-8 ${
                  i < step ? 'bg-gray-900' : 'bg-gray-200'
                }`} />
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
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    رمز SKU *
                  </label>
                  <input
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    placeholder="SKU-001-WHT"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs text-gray-800 outline-none focus:border-gray-400"
                  />
                </div>
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

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  سعر البيع المقترح للمسوق — DZD *
                </label>
                <input
                  type="number"
                  value={form.msrpPrice}
                  onChange={(e) => set('msrpPrice', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  الحد الأدنى للبيع (حماية من حرق الأسعار) — DZD *
                </label>
                <input
                  type="number"
                  value={form.minSellingPrice}
                  onChange={(e) => set('minSellingPrice', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                />
              </div>

              {/* معاينة سريعة للأرباح */}
              {form.basePrice > 0 && form.msrpPrice > 0 && (
                <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
                  <p className="text-xs text-green-700">
                    💰 عمولة المسوق:{' '}
                    <span className="font-bold">
                      {(form.msrpPrice - form.basePrice).toLocaleString('ar-DZ')} DZD
                    </span>
                    {' '}({Math.round(((form.msrpPrice - form.basePrice) / form.msrpPrice) * 100)}%)
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── الخطوة 3: الميديا والتسويق ─── */}
          {step === 2 && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  أيقونة المنتج (emoji مؤقتاً)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-2xl">
                    {form.thumbnail}
                  </div>
                  <input
                    value={form.thumbnail}
                    onChange={(e) => set('thumbnail', e.target.value)}
                    placeholder="👟"
                    className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                  <span className="text-xs text-gray-400">لاحقاً: رفع صورة حقيقية</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  رابط مجلد Google Drive (فيديوهات إعلانية)
                </label>
                <input
                  value={form.mediaFolderUrl}
                  onChange={(e) => set('mediaFolderUrl', e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs text-gray-800 outline-none focus:border-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  سيظهر هذا الرابط للمسوقين ليتمكنوا من تحميل مواد التسويق
                </p>
              </div>

              {/* ملخص قبل الحفظ */}
              <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600">ملخص المنتج</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">الاسم</span>
                  <span className="font-medium text-gray-800">{form.name || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">SKU</span>
                  <span className="font-mono text-gray-800">{form.sku || '—'}</span>
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
              disabled={step === 0 && (!form.name || !form.sku)}
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              التالي
              <ChevronLeft size={13} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-700"
            >
              {isEditing ? 'حفظ التعديلات ✓' : 'حفظ المنتج ✓'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}