import type { DashboardStats } from '../-dashboard.types'

interface Props {
  stats: DashboardStats
}

export function StatsCards({ stats }: Props) {
  const cards = [
    {
      label: 'إجمالي الأرباح',
      value: stats.totalEarnings.toLocaleString('ar-DZ') + ' د.ج',
      sub: 'منذ بداية النشاط',
      danger: false,
    },
    {
      label: 'متاح للسحب',
      value: stats.availableBalance.toLocaleString('ar-DZ') + ' د.ج',
      sub: 'جاهز للتحويل',
      danger: false,
    },
    {
      label: 'معدل الاستلام',
      value: stats.deliveredRate + '%',
      sub: 'نسبة الطلبيات المسلّمة',
      danger: false,
    },
    {
      label: 'معدل الروتور',
      value: stats.retourRate + '%',
      sub: stats.retourRate > 25 ? 'تجاوز الحد المقبول' : 'ضمن النطاق المقبول',
      danger: stats.retourRate > 25,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <p className="truncate text-xs text-gray-500">{card.label}</p>
          <p
            className={`mt-1.5 break-words text-lg font-bold sm:text-xl ${
              card.danger ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {card.value}
          </p>
          <p className={`mt-0.5 text-xs ${card.danger ? 'text-red-400' : 'text-gray-400'}`}>
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  )
}