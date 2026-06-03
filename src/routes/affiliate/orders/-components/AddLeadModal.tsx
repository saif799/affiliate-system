import { useState } from 'react'
import { X } from 'lucide-react'
import type { AddLeadForm } from '../-orders.types'

const PRODUCTS = [
  { id: 'JKT-001', name: 'جاكيت جلد كلاسيكي رجالي', minPrice: 10000, commission: 3000 },
  { id: 'SHO-022', name: 'حذاء رياضي نسائي',          minPrice: 7500,  commission: 2000 },
  { id: 'WTC-005', name: 'ساعة ذكية برو',              minPrice: 15000, commission: 4500 },
  { id: 'BAG-011', name: 'حقيبة ظهر متعددة الاستخدام', minPrice: 8000,  commission: 2500 },
  { id: 'PRF-003', name: 'عطر رجالي فاخر',             minPrice: 5000,  commission: 1500 },
]

const WILAYAS = [
  'الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'سطيف',
  'باتنة', 'تيزي وزو', 'بجاية', 'تلمسان', 'مستغانم',
]

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (form: AddLeadForm) => void
}

const EMPTY: AddLeadForm = {
  productId: '',
  customerName: '',
  customerPhone: '',
  wilaya: '',
  city: '',
  salePrice: 0,
  notes: '',
}

export function AddLeadModal({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<AddLeadForm>(EMPTY)

  if (!open) return null

  const selectedProduct = PRODUCTS.find((p) => p.id === form.productId)

  const estimatedComm = selectedProduct
    ? selectedProduct.commission + Math.max(0, form.salePrice - selectedProduct.minPrice)
    : null

  function handleChange<K extends keyof AddLeadForm>(key: K, value: AddLeadForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleProductChange(id: string) {
    const p = PRODUCTS.find((x) => x.id === id)
    setForm((prev) => ({
      ...prev,
      productId: id,
      salePrice: p ? p.minPrice : 0,
    }))
  }

  function handleSubmit() {
    if (!form.productId || !form.customerName || !form.customerPhone || !form.wilaya) return
    onSubmit(form)
    setForm(EMPTY)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">إضافة طلبية يدوية</h2>
            <p className="text-xs text-gray-400 mt-0.5">للزبائن الذين تواصلوا عبر الماسنجر أو واتساب</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1 px-1 py-3">

          {/* المنتج */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">المنتج</label>
            <select
              value={form.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
            >
              <option value="">اختر المنتج...</option>
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* العمولة المتوقعة */}
          {selectedProduct && (
            <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5 flex items-center justify-between">
              <p className="text-xs text-violet-600">
                العمولة المتوقعة
              </p>
              <p className="text-sm font-bold text-violet-700">
                {estimatedComm?.toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
          )}

          {/* بيانات الزبون */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">اسم الزبون</label>
              <input
                value={form.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                placeholder="عمر بن علي"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">رقم الهاتف</label>
              <input
                value={form.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                placeholder="0551234567"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* الولاية والبلدية */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">الولاية</label>
              <select
                value={form.wilaya}
                onChange={(e) => handleChange('wilaya', e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
              >
                <option value="">اختر الولاية...</option>
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">البلدية</label>
              <input
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="البلدية"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* سعر البيع */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">سعر البيع (د.ج)</label>
            <input
              type="number"
              value={form.salePrice}
              min={selectedProduct?.minPrice ?? 0}
              onChange={(e) => handleChange('salePrice', Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-400">
                الحد الأدنى: {selectedProduct.minPrice.toLocaleString('ar-DZ')} د.ج
              </p>
            )}
          </div>

          {/* ملاحظات */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">ملاحظات للتاجر / شركة التوصيل</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="مثال: الزبون يطلب التوصيل بعد الساعة 4 مساءً..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-gray-900 px-5 py-2 text-xs font-medium text-white hover:bg-gray-700"
          >
            إرسال الطلبية
          </button>
        </div>
      </div>
    </div>
  )
}