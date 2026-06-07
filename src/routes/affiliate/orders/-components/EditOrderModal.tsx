import { useState, useEffect } from 'react'
import { X, Loader2, Home, Building2 } from 'lucide-react'
import {
  getEditableOrder,
  getWilayasLocal,
  getOfficesLocal,
  updateOrderManual
  
  
} from '../-server/orders.api'
import type {LocalWilaya, LocalOffice} from '../-server/orders.api';
import type { EditOrderForm } from '../-orders.types'

interface Props {
  orderId: string | null
  onClose: () => void
  onSaved: () => void | Promise<void>
}

export function EditOrderModal({ orderId, onClose, onSaved }: Props) {
  const [form, setForm] = useState<EditOrderForm | null>(null)
  const [canEditQty, setCanEditQty] = useState(false)
  const [wilayas, setWilayas] = useState<LocalWilaya[]>([])
  const [offices, setOffices] = useState<LocalOffice[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOffices, setLoadingOffices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setForm(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    setForm(null)
    Promise.all([getEditableOrder({ data: { orderId } }), getWilayasLocal()])
      .then(async ([o, w]) => {
        if (cancelled) return
        setWilayas(w)
        setCanEditQty(o.canEditQuantity)
        setForm({
          orderId: o.orderId,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          wilayaCode: o.wilayaCode,
          wilayaName: o.wilayaName,
          officeId: o.officeId ?? '',
          deliveryType: o.deliveryType,
          address: o.address,
          salePrice: o.salePrice,
          quantity: o.quantity,
          notes: o.notes,
        })
        if (o.wilayaCode) {
          setLoadingOffices(true)
          try {
            const offs = await getOfficesLocal({ data: { wilayaCode: o.wilayaCode } })
            if (cancelled) return
            setOffices(offs)
            // استرجاع اختيار البلدية للطلبيات المنزلية (لا تخزّن delivery_office_id)
            if (!o.officeId && o.commune) {
              const match = offs.find((x) => x.name === o.commune)
              if (match) setForm((prev) => (prev ? { ...prev, officeId: match.id } : prev))
            }
          } finally {
            if (!cancelled) setLoadingOffices(false)
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'تعذّر تحميل الطلبية')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  if (!orderId) return null

  const selectedWilaya = form ? wilayas.find((w) => w.code === form.wilayaCode) : undefined
  const officeOptions =
    form && form.deliveryType === 'office' ? offices.filter((o) => o.hasStopDesk) : offices
  const deliveryPrice =
    form && selectedWilaya
      ? form.deliveryType === 'office'
        ? selectedWilaya.officePrice
        : selectedWilaya.homePrice
      : null

  function patch(p: Partial<EditOrderForm>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev))
  }

  async function handleWilayaChange(code: number) {
    const w = wilayas.find((x) => x.code === code)
    patch({ wilayaCode: code, wilayaName: w?.name ?? '', officeId: '' })
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

  async function handleSubmit() {
    if (!form) return
    setError('')
    if (!form.customerName.trim() || !form.customerPhone.trim())
      return setError('اسم ورقم هاتف الزبون مطلوبان')
    if (!form.wilayaCode) return setError('اختر الولاية')
    if (!form.officeId) return setError('اختر البلدية / المكتب')
    if (!form.address.trim()) return setError('العنوان مطلوب')
    if (form.salePrice <= 0) return setError('سعر البيع غير صالح')
    if (form.quantity <= 0) return setError('الكمية غير صالحة')

    setSubmitting(true)
    try {
      await updateOrderManual({ data: form })
      await onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل حفظ التعديل')
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
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl" dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">تعديل الطلبية</h2>
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

          {loading || !form ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" /> جارٍ التحميل...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">اسم الزبون</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => patch({ customerName: e.target.value })}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">رقم الهاتف</label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => patch({ customerPhone: e.target.value })}
                    dir="ltr"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">الولاية</label>
                <select
                  value={form.wilayaCode || ''}
                  onChange={(e) => handleWilayaChange(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400"
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
                <label className="text-xs font-medium text-gray-600">نوع التوصيل</label>
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
                      onClick={() => patch({ deliveryType: v, officeId: '' })}
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  {form.deliveryType === 'office' ? 'مكتب الاستلام' : 'البلدية'}{' '}
                  {loadingOffices && <Loader2 size={11} className="inline animate-spin" />}
                </label>
                <select
                  value={form.officeId}
                  disabled={!form.wilayaCode || loadingOffices}
                  onChange={(e) => patch({ officeId: e.target.value })}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-gray-400 disabled:opacity-60"
                >
                  <option value="">اختر...</option>
                  {officeOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">العنوان</label>
                <input
                  value={form.address}
                  onChange={(e) => patch({ address: e.target.value })}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">سعر البيع (د.ج)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.salePrice}
                    onChange={(e) => patch({ salePrice: Number(e.target.value) })}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    الكمية {!canEditQty && <span className="text-gray-400">(مقفلة بعد التأكيد)</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    disabled={!canEditQty}
                    onChange={(e) => patch({ quantity: Number(e.target.value) })}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">ملاحظات</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => patch({ notes: e.target.value })}
                  rows={2}
                  className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
                />
              </div>
            </>
          )}
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
            disabled={submitting || loading || !form}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            {submitting ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
          </button>
        </div>
      </div>
    </div>
  )
}
