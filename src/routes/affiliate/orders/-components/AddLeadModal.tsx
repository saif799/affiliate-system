import { useState, useEffect } from 'react'
import { X, Package, Loader2, Home, Building2 } from 'lucide-react'
import type { AddLeadForm, LeadProduct } from '../-orders.types'
import { getWilayasLocal, getOfficesLocal } from '../-server/orders.api'
import type { LocalWilaya, LocalOffice } from '../-server/orders.api'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (form: AddLeadForm) => void | Promise<void>
  products: LeadProduct[]
  initialProductId?: string
}

const EMPTY: AddLeadForm = {
  productId: '',
  customerName: '',
  customerPhone: '',
  wilayaCode: 0,
  wilayaName: '',
  officeId: '',
  deliveryType: 'home',
  address: '',
  salePrice: 0,
  notes: '',
}

export function AddLeadModal({
  open,
  onClose,
  onSubmit,
  products,
  initialProductId,
}: Props) {
  const [form, setForm] = useState<AddLeadForm>(EMPTY)
  const [wilayas, setWilayas] = useState<LocalWilaya[]>([])
  const [offices, setOffices] = useState<LocalOffice[]>([])
  const [loadingWilayas, setLoadingWilayas] = useState(false)
  const [loadingOffices, setLoadingOffices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const p = initialProductId
        ? products.find((x) => x.id === initialProductId)
        : undefined
      setForm({
        ...EMPTY,
        productId: p?.id ?? '',
        salePrice: p?.basePrice ?? 0,
      })
      setOffices([])
      setError('')
    }
  }, [open, initialProductId, products])

  // الولايات + الأسعار من الجدول المحلّي (لا اتصال مباشر بـ ECOTRACK)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingWilayas(true)
    getWilayasLocal()
      .then((z) => {
        if (!cancelled) setWilayas(z)
      })
      .catch(() => {
        if (!cancelled)
          setError('تعذّر تحميل قائمة الولايات — راجع الأدمن لمزامنة الأسعار')
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
  const selectedWilaya = wilayas.find((w) => w.code === form.wilayaCode)
  const locked = !!initialProductId || products.length <= 1
  const deliveryPrice = selectedWilaya
    ? form.deliveryType === 'office'
      ? selectedWilaya.officePrice
      : selectedWilaya.homePrice
    : 0

  const estimatedComm = selectedProduct
    ? Math.max(0, form.salePrice - selectedProduct.basePrice - deliveryPrice)
    : null

  // قائمة الخيارات: للمكتب نعرض البلديات ذات stop-desk فقط
  const officeOptions =
    form.deliveryType === 'office'
      ? offices.filter((o) => o.hasStopDesk)
      : offices

  // سعر التوصيل المعروض (من الجدول المحلّي) حسب نوع التوصيل

  // الحدّ الأدنى لسعر البيع = الجملة + التوصيل (يُفرَض على الخادم أيضاً)
  const minSalePrice = selectedProduct
    ? selectedProduct.basePrice + (deliveryPrice ?? 0)
    : 0
  const belowMin =
    !!selectedProduct && deliveryPrice !== null && form.salePrice < minSalePrice

  function handleChange<TKey extends keyof AddLeadForm>(
    key: TKey,
    value: AddLeadForm[TKey],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleWilayaChange(code: number) {
    const w = wilayas.find((x) => x.code === code)
    setForm((prev) => ({
      ...prev,
      wilayaCode: code,
      wilayaName: w?.name ?? '',
      officeId: '',
    }))
    setOffices([])
    if (!code) return
    setLoadingOffices(true)
    try {
      setOffices(await getOfficesLocal({ data: { wilayaCode: code } }))
    } catch {
      setError('تعذّر تحميل بلديات هذه الولاية')
    } finally {
      setLoadingOffices(false)
    }
  }

  function handleDeliveryType(type: 'home' | 'office') {
    // قد لا يكون المكتب المختار ذا stop-desk عند التحويل لـ office → صفّر الاختيار
    setForm((prev) => ({ ...prev, deliveryType: type, officeId: '' }))
  }

  async function handleSubmit() {
    setError('')
    if (!form.productId) return setError('اختر المنتج')
    if (!form.customerName.trim() || !form.customerPhone.trim())
      return setError('اسم ورقم هاتف الزبون مطلوبان')
    if (!form.wilayaCode) return setError('اختر الولاية')
    if (!form.officeId) return setError('اختر البلدية / المكتب')
    if (!form.address.trim()) return setError('العنوان مطلوب')
    if (belowMin)
      return setError(
        `سعر البيع لا يمكن أن يكون أقل من الحدّ الأدنى ${minSalePrice.toLocaleString('ar-DZ')} د.ج (الجملة + التوصيل)`,
      )

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
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl"
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              إضافة طلبية يدوية
            </h2>
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
              <label className="text-xs font-medium text-gray-600">
                اسم الزبون
              </label>
              <input
                value={form.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                placeholder="عمر بن علي"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                رقم الهاتف
              </label>
              <input
                value={form.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                placeholder="0551234567"
                dir="ltr"
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* الولاية */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              الولاية{' '}
              {loadingWilayas && (
                <Loader2 size={11} className="inline animate-spin" />
              )}
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

          {/* نوع التوصيل */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              نوع التوصيل
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: 'home', label: 'توصيل منزلي', Icon: Home },
                  { v: 'office', label: 'استلام من المكتب', Icon: Building2 },
                ] as const
              ).map(({ v, label, Icon }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleDeliveryType(v)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    form.deliveryType === v
                      ? 'border-violet-300 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* البلدية / المكتب */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              {form.deliveryType === 'office' ? 'مكتب الاستلام' : 'البلدية'}{' '}
              {loadingOffices && (
                <Loader2 size={11} className="inline animate-spin" />
              )}
            </label>
            <select
              value={form.officeId}
              disabled={!form.wilayaCode || loadingOffices}
              onChange={(e) => handleChange('officeId', e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400 disabled:opacity-60"
            >
              <option value="">
                {form.wilayaCode ? 'اختر...' : 'اختر الولاية أولاً'}
              </option>
              {officeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {form.deliveryType === 'home' && o.hasStopDesk
                    ? ' (يتوفّر مكتب)'
                    : ''}
                </option>
              ))}
            </select>
            {form.deliveryType === 'office' &&
              form.wilayaCode > 0 &&
              officeOptions.length === 0 &&
              !loadingOffices && (
                <p className="text-xs text-amber-600">
                  لا توجد مكاتب استلام في هذه الولاية — اختر توصيلاً منزليّاً
                </p>
              )}
          </div>

          {/* سعر التوصيل (من الجدول المحلّي) */}
          {deliveryPrice !== null && (
            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <p className="text-xs text-blue-600">
                سعر التوصيل ({form.deliveryType === 'office' ? 'مكتب' : 'منزل'})
              </p>
              <p className="text-sm font-bold text-blue-700">
                {deliveryPrice.toLocaleString('ar-DZ')} د.ج
              </p>
            </div>
          )}

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
            <label className="text-xs font-medium text-gray-600">
              سعر البيع (د.ج)
            </label>
            <input
              type="number"
              value={form.salePrice}
              min={minSalePrice || (selectedProduct?.basePrice ?? 0)}
              onChange={(e) =>
                handleChange('salePrice', Number(e.target.value))
              }
              className={`rounded-lg border px-3 py-2 text-xs outline-none focus:border-gray-400 ${
                belowMin ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
              }`}
            />
            {selectedProduct && (
              <>
                <p className="text-xs text-gray-400">
                  الجملة {selectedProduct.basePrice.toLocaleString('ar-DZ')} د.ج
                  {deliveryPrice !== null ? (
                    <>
                      {' '}
                      + التوصيل {deliveryPrice.toLocaleString('ar-DZ')} د.ج ={' '}
                      <span className="font-semibold text-gray-600">
                        الحدّ الأدنى {minSalePrice.toLocaleString('ar-DZ')} د.ج
                      </span>
                    </>
                  ) : (
                    <> — اختر الولاية لاحتساب الحدّ الأدنى (الجملة + التوصيل)</>
                  )}
                </p>
                {belowMin && (
                  <p className="text-xs font-medium text-amber-600">
                    ⚠️ سعر البيع أقل من الحدّ الأدنى — لن يغطّي تكلفة التوصيل
                  </p>
                )}
              </>
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
