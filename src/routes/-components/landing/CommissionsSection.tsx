// ─── src/routes/-components/landing/CommissionsSection.tsx ───

import { commissions } from '../../-data/landing.data'

function IconFashion() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
    </svg>
  )
}
function IconBeauty() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
      <path d="M12 2v5m3.9 1.5-1 4.8M19.3 6.7 16 10"/>
      <circle cx="15" cy="12" r="3"/>
    </svg>
  )
}
function IconElectronics() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <circle cx="12" cy="18" r="0.5" fill="currentColor"/>
      <path d="M9 7h6M9 11h6"/>
    </svg>
  )
}
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function IconFood() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  )
}
function IconGift() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}

const iconMap: Record<string, React.ReactNode> = {
  fashion:     <IconFashion />,
  beauty:      <IconBeauty />,
  electronics: <IconElectronics />,
  home:        <IconHome />,
  food:        <IconFood />,
  gift:        <IconGift />,
}

export function CommissionsSection() {
  return (
    <section id="features" className="mx-auto max-w-285 px-12 py-16">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          هيكل العمولات
        </span>
      </div>
      <h2 className="mb-3 text-[34px] font-black leading-tight text-gray-900">
        عمولات شفافة<br />بدون مفاجآت
      </h2>
      <p className="mb-10 max-w-130 text-[15px] leading-[1.7] text-gray-500">
        كل عمولة محددة مسبقاً وظاهرة قبل بدء الترويج. لا خصومات مخفية، لا مفاجآت.
      </p>

      <div className="grid grid-cols-3 gap-5">
        {commissions.map((c) => (
          <div
            key={c.category}
            className="group rounded-xl border border-gray-100 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-violet-100 hover:shadow-[0_4px_24px_rgba(124,58,237,0.1)]"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
              {iconMap[c.iconId]}
            </div>
            <div className="mb-1.5 text-sm font-extrabold text-gray-900">{c.category}</div>
            <div className="text-[28px] font-black text-violet-600">{c.rate}</div>
            <div className="mt-1 text-[11.5px] font-semibold text-gray-400">من سعر البيع</div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-violet-50">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-500 to-violet-400"
                style={{ width: `${c.barPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}