// ─── src/routes/-components/landing/TickerBanner.tsx ───

import { tickerItems } from '../../-data/landing.data'

// نضاعف العناصر لضمان حركة لا نهائية سلسة
const doubled = [...tickerItems, ...tickerItems]

export function TickerBanner() {
  return (
    <div className="overflow-hidden bg-violet-900 py-3.5">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{
          animation: 'ticker 28s linear infinite',
          width: 'max-content',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-[12.5px] font-bold text-white/75"
          >
            <span className="h-1.25 w-1.25 shrink-0 rounded-full bg-violet-400" />
            {item}
          </span>
        ))}
      </div>

      {/* Keyframe مضمّن */}
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
