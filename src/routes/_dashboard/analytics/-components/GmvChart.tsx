import type { GmvPoint } from '../-analytics.types'

interface GmvChartProps {
  series: GmvPoint[]
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('fr-DZ')
}

function fmtDzd(n: number) {
  return `${fmt(n)} دج`
}

export function GmvChart({ series }: GmvChartProps) {
  if (!series.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center h-40 text-gray-400 text-sm">
        لا توجد بيانات للفترة المحددة
      </div>
    )
  }

  const W = 600
  const H = 140
  const pad = { top: 12, bottom: 24, left: 8, right: 8 }

  const maxVal = Math.max(...series.map((p) => p.gmv_dzd), 1)
  const xStep  = (W - pad.left - pad.right) / Math.max(series.length - 1, 1)

  const points = series.map((p, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + ((maxVal - p.gmv_dzd) / maxVal) * (H - pad.top - pad.bottom),
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  const area = [
    `M${points[0].x},${H - pad.bottom}`,
    ...points.map((p) => `L${p.x},${p.y}`),
    `L${points[points.length - 1].x},${H - pad.bottom}`,
    'Z',
  ].join(' ')

  const total = series.reduce((s, p) => s + p.gmv_dzd, 0)
  const last  = points[points.length - 1]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex justify-between items-center mb-3 flex-row-reverse">
        <span className="text-sm font-medium text-gray-700">تطور GMV</span>
        <span className="text-xs text-gray-400">{fmtDzd(total)}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        height={H}
      >
        <defs>
          <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"    />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gmvGrad)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r="4" fill="#3b82f6" />
      </svg>
    </div>
  )
}