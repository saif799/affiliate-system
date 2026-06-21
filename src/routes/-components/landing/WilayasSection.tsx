// ─── src/routes/-components/landing/WilayasSection.tsx ───

import { wilayas } from '../../-data/landing.data'

export function WilayasSection() {
  return (
    <section id="coverage" className="bg-violet-900 px-4 py-12 sm:px-6 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1140px]">

        {/* Header */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wide text-white/80">
            📍 التغطية الجغرافية
          </span>
        </div>
        <h2 className="mb-3 text-[26px] font-black leading-[1.25] text-white sm:text-[30px] lg:text-[34px]">
          نصل إلى كل ولاية<br />في الجزائر
        </h2>
        <p className="mb-9 max-w-[520px] text-[15px] leading-[1.7] text-white/60">
          58 ولاية مغطاة بالكامل مع شركاء توصيل موثوقين في كل منطقة.
        </p>

        {/* Pills */}
        <div className="flex flex-wrap gap-2.5">
          {wilayas.map((w) => (
            <span
              key={w.name}
              className={`rounded-full border px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
                w.active
                  ? 'border-transparent bg-violet-500 text-white'
                  : 'border-white/15 bg-white/8 text-white/70 hover:bg-violet-500 hover:text-white hover:border-transparent'
              }`}
            >
              {w.name}
            </span>
          ))}
          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 text-[12.5px] font-semibold text-violet-300">
            + 38 ولاية أخرى
          </span>
        </div>

      </div>
    </section>
  )
}
