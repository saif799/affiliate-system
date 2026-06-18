// ─── src/routes/-components/landing/LandingFooter.tsx ───

import { footerCols } from '../../-data/landing.data'

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 px-12 pb-8 pt-14 text-white/60">
      <div className="mx-auto max-w-[1140px]">

        {/* Grid */}
        <div
          className="mb-10"
          style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px' }}
        >
          {/* Brand */}
          <div>
            <div className="mb-3 text-[22px] font-black text-white">DzDrop</div>
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
                    key={link}
                    href="#"
                    className="text-[12.5px] text-white/50 transition-colors hover:text-white"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <span className="text-xs">
            © {new Date().getFullYear()} DzDrop. جميع الحقوق محفوظة · التجارة الإلكترونية في
            الجزائر
          </span>
          <span className="rounded-full border border-violet-500/50 bg-violet-900/30 px-3 py-1 text-[11px] font-bold text-violet-400">
            Made in Algeria 🇩🇿
          </span>
        </div>

      </div>
    </footer>
  )
}
