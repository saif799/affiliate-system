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
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}