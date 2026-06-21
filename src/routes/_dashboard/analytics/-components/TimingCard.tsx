import type { DeliveryTiming } from '../-analytics.types'

interface TimingCardProps {
  timing: DeliveryTiming
}

export function TimingCard({ timing }: TimingCardProps) {
  const stages = [
    { label: 'التأكيد',      hours: timing.avg_confirm_hours, color: 'bg-blue-400'    },
    { label: 'الشحن',        hours: timing.avg_ship_hours,    color: 'bg-violet-400'  },
    { label: 'وصول الولاية', hours: timing.avg_wilaya_hours,  color: 'bg-amber-400'   },
    { label: 'التسليم',      hours: timing.avg_deliver_hours, color: 'bg-emerald-400' },
  ]

  const maxH = Math.max(...stages.map((s) => s.hours), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex justify-between flex-row-reverse items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">
          متوسط وقت التوصيل
        </span>
        <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
          {timing.avg_total_days} يوم إجمالي
        </span>
      </div>
      <div className="flex items-end gap-3 h-24 flex-row-reverse">
        {stages.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-medium text-gray-700">{s.hours}س</span>
            <div
              className={`w-full ${s.color} rounded-t`}
              style={{ height: `${Math.max((s.hours / maxH) * 72, 4)}px` }}
            />
            <span className="text-xs text-gray-400 text-center leading-tight">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}