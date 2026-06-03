'use client'

import { useState } from 'react'
import type { FinancialSettings } from '../-settings.types'
import { updateFinancialSettings } from '../-server/settings.api'

interface Props {
  data: FinancialSettings
}

const scheduleLabels: Record<string, string> = {
  weekly:   'أسبوعي',
  biweekly: 'كل أسبوعين',
  monthly:  'شهري',
}

export function FinancialTab({ data }: Props) {
  const [merchantFee, setMerchantFee]   = useState(String(data.platform_fee_merchant))
  const [affiliateFee, setAffiliateFee] = useState(String(data.platform_fee_affiliate))
  const [minPayout, setMinPayout]       = useState(String(data.minimum_payout))
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const isDirty =
    Number(merchantFee) !== data.platform_fee_merchant ||
    Number(affiliateFee) !== data.platform_fee_affiliate ||
    Number(minPayout) !== data.minimum_payout

  async function handleSave() {
    const merchantNum = Number(merchantFee)
    const affiliateNum = Number(affiliateFee)
    const minNum = Number(minPayout)

    if (isNaN(merchantNum) || merchantNum < 0 || isNaN(affiliateNum) || affiliateNum < 0) {
      setError('رسوم المنصة يجب أن تكون أرقاماً موجبة')
      return
    }
    if (isNaN(minNum) || minNum < 0) {
      setError('الحد الأدنى للصرف يجب أن يكون رقماً موجباً')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateFinancialSettings({
        data: {
          platform_fee_merchant:  merchantNum,
          platform_fee_affiliate: affiliateNum,
          minimum_payout:         minNum,
          payout_schedule:        data.payout_schedule,
          payout_methods:         data.payout_methods,
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('حدث خطأ أثناء الحفظ، حاول مجدداً')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Platform Fee */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">رسوم المنصة</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            تُخصم تلقائياً من كل طلبية عند تأكيد التوصيل
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              رسوم المنصة من التاجر
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition">
              <input
                type="number"
                min={0}
                value={merchantFee}
                onChange={(e) => { setMerchantFee(e.target.value); setSaved(false) }}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 bg-white outline-none text-right"
              />
              <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 flex items-center py-2.5">
                DZD
              </span>
            </div>
            <p className="text-xs text-gray-400">
              تُخصم من أرباح التاجر لكل طلبية موصّلة
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              رسوم المنصة من المسوّق
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition">
              <input
                type="number"
                min={0}
                value={affiliateFee}
                onChange={(e) => { setAffiliateFee(e.target.value); setSaved(false) }}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 bg-white outline-none text-right"
              />
              <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 flex items-center py-2.5">
                DZD
              </span>
            </div>
            <p className="text-xs text-gray-400">
              تُخصم من عمولة المسوّق لكل طلبية موصّلة
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">الحد الأدنى للصرف</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition">
              <input
                type="number"
                min={0}
                value={minPayout}
                onChange={(e) => { setMinPayout(e.target.value); setSaved(false) }}
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 bg-white outline-none text-right"
              />
              <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 flex items-center py-2.5">
                DZD
              </span>
            </div>
          </div>
        </div>

        {/* Save row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div>
            {error  && <p className="text-xs text-red-600">{error}</p>}
            {saved  && <p className="text-xs text-emerald-600">✓ تم الحفظ بنجاح</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDirty && !saving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Payout Settings — read only */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">إعدادات الصرف</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">جدول الصرف</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
              <span className="text-gray-900 font-semibold">
                {scheduleLabels[data.payout_schedule] ?? data.payout_schedule}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">طرق الصرف المتاحة</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 flex-wrap">
              {data.payout_methods.map((method) => (
                <span
                  key={method}
                  className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 flex gap-3 items-start">
        <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">كيف تعمل الرسوم؟</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>عند تسجيل طلبية بحالة <strong>موصّلة</strong>، تُخصم رسوم المنصة تلقائياً من الطرفين.</li>
            <li>عمولة المسوّق = (سعر بيعه − سعر التاجر) − رسوم المنصة من المسوّق.</li>
            <li>أرباح التاجر = سعر التاجر − رسوم المنصة من التاجر.</li>
            <li>الطلبيات المرتجعة أو الملغاة لا تخضع لأي رسوم.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}