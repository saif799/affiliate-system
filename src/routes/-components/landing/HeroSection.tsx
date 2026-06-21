// ─── src/routes/-components/landing/HeroSection.tsx ───

import { heroStats, dashboardKpis, dashboardWilayas } from '../../-data/landing.data'

export function HeroSection() {
  return (
    <section
      id="hero"
      className="mx-auto max-w-285 px-4 pt-10 pb-10 sm:px-6 sm:pt-14 lg:px-12 lg:pt-16 lg:pb-12"
    >
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

        {/* ── النص الرئيسي ── */}
        <div>
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
            <span className="text-xs font-bold text-yellow-800">
              الإطلاق الرسمي في الجزائر · 58 ولاية
            </span>
          </div>

          <h1 className="mb-5 text-[32px] font-black leading-[1.18] text-gray-900 sm:text-[40px] lg:text-[46px]">
            مستقبل التجارة<br />
            الإلكترونية في<br />
            <span className="text-violet-600">الجزائر بين يديك</span>
          </h1>

          <p className="mb-8 max-w-110 text-[15.5px] leading-[1.75] text-gray-500 lg:mb-9">
            المنصة الأولى التي تحمي حقوقك وتمنحك الحرية الكاملة لإدارة تجارتك.
            سواء كنت تاجراً يبحث عن التوسع، أو مسوقاً يطمح للاستقلال المالي.
          </p>

          {/* CTA — المسوق Primary، التاجر Secondary */}
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mb-12">
            <a
              href="#affiliates"
              className="flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)] transition-all hover:-translate-y-0.5 hover:bg-violet-800 sm:px-7"
            >
              انضم كمسوق — ابدأ الربح ←
            </a>
            <a
              href="#merchants"
              className="rounded-full border-[1.5px] border-violet-300 bg-white px-6 py-3.5 text-center text-sm font-bold text-violet-700 transition-all hover:-translate-y-0.5 hover:border-violet-500 hover:bg-violet-50 sm:px-7"
            >
              سجّل كتاجر — بع سلعتك
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-black text-violet-900">{stat.value}</div>
                <div className="mt-0.5 text-xs font-semibold text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dashboard Preview ── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-900 to-violet-600 p-5 shadow-[0_8px_48px_rgba(76,29,149,0.28)] sm:p-7">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5" />

          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70">لوحة تحكم التاجر</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
              مباشر الآن
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5">
            {dashboardKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[10px] border border-white/15 bg-white/10 px-3.5 py-3"
              >
                <div className="mb-1 text-[10px] font-semibold text-white/60">{kpi.label}</div>
                <div className="text-[19px] font-black text-white">{kpi.value}</div>
                <div className="mt-0.5 text-[10px] font-bold text-green-300">{kpi.trend}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2.5 text-[10px] font-bold text-white/50">أعلى الولايات مبيعاً</div>
            {dashboardWilayas.map((w) => (
              <div key={w.name} className="mb-2 flex items-center gap-2">
                <span className="min-w-16 text-right text-[10px] text-white/60">{w.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-violet-400 to-purple-300"
                    style={{ width: `${w.pct}%` }}
                  />
                </div>
                <span className="min-w-10 text-left text-[10px] text-white/70">
                  {w.orders} طلب
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}