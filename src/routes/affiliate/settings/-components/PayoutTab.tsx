// ============================================================
// -components/PayoutTab.tsx
// ============================================================

import { Info, CreditCard, Smartphone } from 'lucide-react'
import type { PayoutMethod, PayoutMethodType } from '../-settings.types'

interface Props {
  methods: PayoutMethod[]
}

const METHOD_ICONS: Record<PayoutMethodType, React.ReactNode> = {
  CCP: <CreditCard size={14} />,
  BaridiMob: <Smartphone size={14} />,
}

export function PayoutTab({ methods }: Props) {
  return (
    <div className="space-y-4">
      {/* ملاحظة توضيحية */}
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-xs text-gray-600 leading-relaxed">
          تُضاف حساباتك المالية تلقائياً انطلاقاً من طلبات السحب التي تقوم بها من
          المحفظة. اختر طريقة الدفع وأدخل رقم حسابك عند كل عملية سحب.
        </p>
      </div>

      {/* لا توجد حسابات بعد */}
      {methods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center">
          <p className="text-xs text-gray-400">
            لم تُسجّل أي حساب مالي بعد — سيظهر هنا بعد أول طلب سحب.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {methods.map((method, i) => (
            <div
              key={method.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < methods.length - 1 ? 'border-b border-gray-50' : ''
              } ${method.isDefault ? 'bg-emerald-50/40' : ''}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                {METHOD_ICONS[method.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-900">{method.label}</p>
                  {method.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      الأحدث
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400 truncate" dir="ltr">
                  {method.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
