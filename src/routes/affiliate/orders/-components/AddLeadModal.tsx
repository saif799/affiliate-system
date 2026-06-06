import { useState, useEffect } from 'react'
import { X, Package, Loader2 } from 'lucide-react'
import type { AddLeadForm, LeadProduct } from '../-orders.types'
import { getDeliveryZones, getDeliveryCommunes } from '../-server/orders.api'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (form: AddLeadForm) => void | Promise<void>
  products: LeadProduct[]
  initialProductId?: string // لتثبيت منتج محدّد عند الفتح من السوق
}

const EMPTY: AddLeadForm = {
  productId: '',
  customerName: '',
  customerPhone: '',
  wilayaCode: 0,
  wilayaName: '',
  commune: '',
  address: '',
  salePrice: 0,
  notes: '',
}

type Zone = { code: number; name: string }
type Commune = { name: string; hasStopDesk: boolean }

export function AddLeadModal({ open, onClose, onSubmit, products, initialProductId }: Props) {
  const [form, setForm] = useState<AddLeadForm>(EMPTY)
  const [wilayas, setWilayas] = useState<Zone[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [loadingWilayas, setLoadingWilayas] = useState(false)
  const [loadingCommunes, setLoadingCommunes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // عند الفتح: إعادة التهيئة مع تعبئة المنتج المحدّد مسبقاً إن وُجد
  useEffect(() => {
    if (open) {
      const p = initialProductId
        ? products.find((x) => x.id === initialProductId)
        : undefined
      setForm({ ...EMPTY, productId: p?.id ?? '', salePrice: p?.basePrice ?? 0 })
      setCommunes([])
      setError('')
    }
  }, [open, initialProductId, products])

  // تحميل الولايات من شركة التوصيل مرّة واحدة عند الفتح
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingWilayas(true)
    getDeliveryZones()
      .then((z) => {
        if (!cancelled) setWilayas(z)
      })
      .catch(() => {
        if (!cancelled) setError('تعذّر تحميل قائمة الولايات من شركة التوصيل')
      })
      .finally(() => {
        if (!cancelled) setLoadingWilayas(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  const selectedProduct = products.find((p) => p.id === form.productId)
  // الطلبية اليدوية تُنشأ دائماً من السوق على منتج محدّد → اقفل المنتج
  const locked = !!initialProductId || products.length <= 1
  const estimatedComm = selectedProduct
    ? Math.max(0, form.salePrice - selectedProduct.basePrice)
    : null

  function handleChange<TKey extends keyof AddLeadForm>(key: TKey, value: AddLeadForm[TKey]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleWilayaChange(code: number) {
    const w = wilayas.find((x) => x.code === code)
    setForm((prev) => ({ ...prev, wilayaCode: code, wilayaName: w?.name ?? '', commune: '' }))
    setCommunes([])
    if (!code) return
    setLoadingCommunes(true)
    try {
      setCommunes(await getDeliveryCommunes({ data: { wilayaCode: code } }))
    } catch {
      setError('تعذّر تحميل بلديات هذه الولاية')
    } finally {
      setLoadingCommunes(false)
    }
  }

  async function handleSubmit() {
    setError('')
    if (!form.productId) return setError('اختر المنتج')
    if (!form.customerName.trim() || !form.customerPhone.trim())
      return setError('اسم ورقم هاتف الزبون مطلوبان')
    if (!form.wilayaCode || !form.commune) return setError('اختر الولاية والبلدية')
    if (!form.address.trim()) return setError('العنوان مطلوب')
    if (selectedProduct && form.salePrice < selectedProduct.basePrice)
      return setError('سعر البيع لا يمكن أن يكون أقل من سعر الجملة')

    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm(EMPTY)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إرسال الطلبية')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">إضافة طلبية يدوية</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              للزبائن الذين تواصلوا عبر الماسنجر أو واتساب
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto px-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* المنتج */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">المنتج</label>
            {locked && selectedProduct ? (
              <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-medium text-gray-800">
                <Package size={14} className="shrink-0 text-violet-500" />
                {selectedProduct.name}
              </div>
            ) : (
              <select
                value={form.productId}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value)
                  setForm((prev) => ({
                    ...prev,
                    productId: e.target.value,
                    salePrice: p ? p.basePrice : 0,
                  }))
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
              >
                <option value="">اختر المنتج...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* العمولة المتوقعة */}
          {selectedProduct && (
            <div className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50 px-3 py-2.5">
              <p className="text-xs text-violet-600">العمولة المتوقعة</p>
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
                dir="ltr"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* الولاية والبلدية (من شركة التوصيل لضمان القبول) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                الولاية {loadingWilayas && <Loader2 size={11} className="inline animate-spin" />}
              </label>
              <select
                value={form.wilayaCode || ''}
                disabled={loadingWilayas}
                onChange={(e) => handleWilayaChange(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400 disabled:opacity-60"
              >
                <option value="">اختر الولاية...</option>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                البلدية {loadingCommunes && <Loader2 size={11} className="inline animate-spin" />}
              </label>
              <select
                value={form.commune}
                disabled={!form.wilayaCode || loadingCommunes}
                onChange={(e) => handleChange('commune', e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400 disabled:opacity-60"
              >
                <option value="">
                  {form.wilayaCode ? 'اختر البلدية...' : 'اختر الولاية أولاً'}
                </option>
                {communes.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                    {c.hasStopDesk ? ' (مكتب)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* العنوان */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">العنوان</label>
            <input
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="الحي، الشارع، أقرب نقطة معروفة..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>

          {/* سعر البيع */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">سعر البيع (د.ج)</label>
            <input
              type="number"
              value={form.salePrice}
              min={selectedProduct?.basePrice ?? 0}
              onChange={(e) => handleChange('salePrice', Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-400">
                سعر الجملة: {selectedProduct.basePrice.toLocaleString('ar-DZ')} د.ج — تبيع بالسعر الذي تريده
              </p>
            )}
          </div>

          {/* ملاحظات */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              ملاحظات للتاجر / شركة التوصيل
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="مثال: الزبون يطلب التوصيل بعد الساعة 4 مساءً..."
              className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلبية'}
          </button>
        </div>
      </div>
    </div>
  )
}
