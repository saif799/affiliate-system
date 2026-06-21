import type { ActivityItem, ActivityType } from '../-dashboard.types'

const activityConfig: Record<ActivityType, { icon: string; color: string; label: string }> = {
  conversion:      { icon: '💰', color: 'bg-green-50 text-green-700',   label: 'تحويل جديد'   },
  new_merchant:    { icon: '🏪', color: 'bg-blue-50 text-blue-700',     label: 'متجر جديد'    },
  new_affiliate:   { icon: '🤝', color: 'bg-purple-50 text-purple-700', label: 'مسوّق جديد'   },
  commission_paid: { icon: '✅', color: 'bg-amber-50 text-amber-700',   label: 'عمولة مدفوعة' },
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">آخر النشاطات</h2>

      <ul className="space-y-3">
        {activities.map((item) => {
          const cfg = activityConfig[item.type]
          return (
            <li key={item.id} className="flex items-start gap-3">

              {/* ✅ الحل: نستخدم [] بدل backtick */}
              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                  cfg.color,
                ].join(' ')}
              >
                {cfg.icon}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {cfg.label} — {item.actor}
                  </p>
                  {item.amount && (
                    <span className="text-xs font-semibold text-green-600 shrink-0">
                      +{item.amount.toLocaleString('fr-DZ')} DZD
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {item.wilaya} · {item.timestamp}
                </p>
              </div>

            </li>
          )
        })}
      </ul>
    </div>
  )
}