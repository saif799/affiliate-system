import { Activity } from 'lucide-react'

// ملاحظة: لا يوجد بعد جدول لتسجيل أحداث API الخارجية (التكاملات أدناه قيد
// التطوير). نعرض حالة فارغة صادقة بدل بيانات ملفّقة. عند تفعيل تكامل فعليّ
// لاحقاً يُربَط هذا اللوح بمصدر أحداث حقيقي (جدول api_logs أو ما شابه).

export function ApiLogsPanel() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800">سجل أحداث API</h2>
          <p className="text-xs text-gray-400">يظهر هنا نشاط التكاملات بعد تفعيلها</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          غير مُفعَّل
        </span>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
          <Activity size={18} />
        </div>
        <p className="text-xs text-gray-500">لا توجد أحداث مُسجَّلة بعد</p>
        <p className="text-xs text-gray-400">
          ستظهر سجلّات الطلبات والمزامنة هنا حال ربط أوّل تكامل خارجي
        </p>
      </div>
    </div>
  )
}
