interface ChangeProps {
  pct: number | null
}

export function Change({ pct }: ChangeProps) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>
  const up = pct >= 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}% vs الفترة السابقة
    </span>
  )
}