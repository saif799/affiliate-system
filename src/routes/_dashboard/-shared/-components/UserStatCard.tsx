// src/routes/_dashboard/-shared/-components/UserStatCard.tsx

interface Props {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent: string
}

export function UserStatCard({ icon, label, value, sub, accent }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm flex items-start gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-none truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  )
}