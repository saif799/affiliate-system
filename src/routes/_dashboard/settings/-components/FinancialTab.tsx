import type { FinancialSettings } from '../settings.types'

interface Props {
  data: FinancialSettings
}

const scheduleLabels = {
  weekly: 'أسبوعي',
  biweekly: 'كل أسبوعين',
  monthly: 'شهري',
}

export function FinancialTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">الإعدادات الأساسية</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">نسبة العمولة الافتراضية</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <span className="text-gray-900 font-semibold">{data.defaultTakeRate}%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">الحد الأدنى للصرف</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <span className="text-gray-900 font-semibold">
                {new Intl.NumberFormat('fr-DZ').format(data.minimumPayout)} DZD
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">جدول الصرف</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <span className="text-gray-900 font-semibold">
                {scheduleLabels[data.payoutSchedule]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">العمولة حسب الفئة</h2>
        <div className="space-y-3">
          {data.categoryCommissions.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-700 font-medium">{item.category}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(item.rate / 15) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-600 w-10 text-right">
                  {item.rate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}