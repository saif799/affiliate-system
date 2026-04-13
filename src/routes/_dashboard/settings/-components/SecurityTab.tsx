import type { SecuritySettings } from '../settings.types'

interface Props {
  data: SecuritySettings
}

export function SecurityTab({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">المصادقة الثنائية (2FA)</h2>
            <p className="text-sm text-gray-500 mt-0.5">طبقة حماية إضافية لحساب المدير</p>
          </div>
          <div className={`relative w-12 h-6 rounded-full transition-colors ${data.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${data.twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        </div>
        <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
          🔧 سيتم تفعيل هذه الميزة عند ربط قاعدة البيانات
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">الجلسات النشطة</h2>
        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">💻</div>
            <div>
              <p className="text-sm font-medium text-gray-900">الجلسة الحالية</p>
              <p className="text-xs text-gray-400">Sétif, Algeria • Chrome</p>
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">نشطة</span>
        </div>
        <div className="mt-4">
          <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
            إنهاء جميع الجلسات الأخرى
          </button>
        </div>
        <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
          🔧 إدارة الجلسات الكاملة ستكون متاحة بعد ربط قاعدة البيانات
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">تغيير كلمة المرور</h2>
        <p className="text-sm text-gray-500 mb-4">يُنصح بتغييرها كل 3 أشهر</p>
        <div className="space-y-3">
          {['كلمة المرور الحالية', 'كلمة المرور الجديدة', 'تأكيد كلمة المرور'].map((label) => (
            <div key={label} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-gray-50"
              />
            </div>
          ))}
        </div>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          حفظ كلمة المرور
        </button>
      </div>
    </div>
  )
}