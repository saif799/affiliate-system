// ─── src/routes/-components/landing/LandingFooter.tsx ───

import { footerCols } from '../../-data/landing.data'

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 px-4 pb-8 pt-14 text-white/60 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1140px]">

        {/* Grid */}
        <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-3 text-[22px] font-black text-white">DzAffilio</div>
            <p className="text-[13px] leading-[1.7]">
              المنصة الأولى للتجارة الإلكترونية والتسويق بالعمولة في الجزائر.
              نربط التجار بالمسوقين لبناء اقتصاد رقمي جزائري حقيقي.
            </p>
          </div>

          {/* Cols */}
          {footerCols.map((col) => (
            <div key={col.title}>
              <div className="mb-3.5 text-[13px] font-extrabold text-white">{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[12.5px] text-white/50 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-start gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs leading-relaxed">
            © {new Date().getFullYear()} DzAffilio. جميع الحقوق محفوظة · التجارة الإلكترونية في
            الجزائر
          </span>
          <span className="shrink-0 rounded-full border border-violet-500/50 bg-violet-900/30 px-3 py-1 text-[11px] font-bold text-violet-400">
            Made in Algeria 🇩🇿
          </span>
        </div>

      </div>
    </footer>
  )
}
