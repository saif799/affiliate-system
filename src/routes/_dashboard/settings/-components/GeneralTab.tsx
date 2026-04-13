import type { GeneralSettings } from '../settings.types'

interface Props {
  data: GeneralSettings
}

export function GeneralTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">معلومات المنصة</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: 'اسم المنصة', value: data.platformName },
            { label: 'البريد الإلكتروني للدعم', value: data.supportEmail },
            { label: 'رابط شروط الاستخدام', value: data.termsUrl },
            { label: 'رابط سياسة الخصوصية', value: data.privacyUrl },
          ].map((field) => (
            <div key={field.label} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{field.label}</label>
              <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                <span className="text-sm text-gray-900">{field.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">وضع الصيانة</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              عند التفعيل يتوقف الوصول لجميع صفحات المنصة
            </p>
          </div>
          <div
            className={`relative w-12 h-6 rounded-full transition-colors ${
              data.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                data.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </div>
        </div>
        {data.maintenanceMode && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            ⚠️ المنصة في وضع الصيانة حالياً — المستخدمون لا يستطيعون الوصول
          </div>
        )}
      </div>
    </div>
  )
}