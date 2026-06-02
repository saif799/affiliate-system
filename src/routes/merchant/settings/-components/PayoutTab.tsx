import type { PayoutData, PayoutMethod } from '../-settings.types'

interface Props {
  data: PayoutData
}

const PAYOUT_ICONS: Record<PayoutMethod, string> = {
  CCP: '📮',
  BaridiMob: '📱',
}

export default function PayoutTab({ data }: Props) {
  const fmt = (n: number) => n.toLocaleString('ar-DZ')

  return (
    <div className="space-y-8">
      {/* Payout Accounts */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            حسابات السحب المستخدمة
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            الحسابات التي استخدمتها في طلبات السحب السابقة
          </p>
        </div>

        {data.accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-xs text-gray-400">
              لا توجد حسابات بعد — ستظهر هنا بعد أول طلب سحب
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.accounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                  account.isDefault
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                    {PAYOUT_ICONS[account.type]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {account.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5" dir="ltr">
                      {account.detail}
                    </p>
                  </div>
                </div>

                {account.isDefault && (
                  <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                    الأحدث
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Minimum Payout Info */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            الحد الأدنى للسحب
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            أقل مبلغ يمكنك طلب سحبه من المحفظة
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 w-fit">
          <p className="text-xl font-bold text-gray-900">
            {fmt(data.minimumPayout)} <span className="text-xs text-gray-400">DZD</span>
          </p>
        </div>
      </section>
    </div>
  )
}
