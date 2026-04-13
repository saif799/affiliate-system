interface Props {
  total: number
  active: number
  commissions: number
}

export function AffiliateStatsBar({ total, active, commissions }: Props) {
  const stats = [
    {
      label: 'إجمالي المسوقين',
      value: total,
      icon: '👥',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'المسوقون النشطون',
      value: active,
      icon: '✅',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'العمولات المدفوعة',
      value: new Intl.NumberFormat('fr-DZ').format(commissions) + ' DZD',
      icon: '💰',
      color: 'bg-purple-50 text-purple-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl ${s.color}`}>
            {s.icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-xl font-semibold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}