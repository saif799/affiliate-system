// ─── src/routes/-components/landing/CommissionsSection.tsx ───
//
// نموذج الربح الحقيقي للمنصّة: لا نِسَب عمولة ثابتة. التاجر يضع سعر الجملة،
// والمسوّق يحدّد سعر بيعه ويربح الفارق بعد رسوم المنصة (هامش مفتوح).

import { marketCategories, marginExample } from '../../-data/landing.data'

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

const fmt = (n: number) => n.toLocaleString('ar-DZ')

/** كتلة قيمة داخل معادلة الربح — تتكدّس رأسياً على الجوّال وأفقياً على الشاشات الأكبر. */
function ValueBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'sell' | 'plain' | 'profit'
}) {
  const styles =
    tone === 'profit'
      ? 'border-transparent bg-violet-600 text-white'
      : tone === 'sell'
        ? 'border-violet-200 bg-violet-50 text-violet-700'
        : 'border-gray-200 bg-white text-gray-700'
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center rounded-xl border px-3 py-3 text-center ${styles}`}
    >
      <span
        className={`text-[11px] font-semibold ${tone === 'profit' ? 'text-white/75' : 'text-gray-400'}`}
      >
        {label}
      </span>
      <span className="mt-0.5 text-base font-black sm:text-lg">{fmt(value)} دج</span>
    </div>
  )
}

function Op({ children }: { children: string }) {
  return (
    <span className="mx-auto flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full bg-gray-100 text-base font-black text-gray-500">
      {children}
    </span>
  )
}

export function CommissionsSection() {
  return (
    <section id="features" className="mx-auto max-w-285 px-4 py-12 sm:px-6 lg:px-12 lg:py-16">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          نموذج الربح
        </span>
      </div>
      <h2 className="mb-3 text-[26px] font-black leading-tight text-gray-900 sm:text-[30px] lg:text-[34px]">
        ربحك مفتوح —<br />أنت من يحدّده
      </h2>
      <p className="mb-8 max-w-150 text-[15px] leading-[1.7] text-gray-500">
        لا عمولات ثابتة بالنسبة المئوية. التاجر يضع سعر الجملة، والمسوّق يحدّد سعر
        بيعه ويربح الفارق بعد رسوم المنصة — كلّما أبدعت في التسويق، زاد ربحك.
      </p>

      {/* معادلة الربح */}
      <div className="mb-10 rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_4px_28px_rgba(124,58,237,0.07)] sm:p-6">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-2.5">
          <ValueBlock label="سعر بيعك" value={marginExample.sellPrice} tone="sell" />
          <Op>−</Op>
          <ValueBlock label="سعر الجملة" value={marginExample.wholesale} tone="plain" />
          <Op>−</Op>
          <ValueBlock label="رسوم المنصة" value={marginExample.fee} tone="plain" />
          <Op>=</Op>
          <ValueBlock label="ربحك الصافي" value={marginExample.profit} tone="profit" />
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          مثال توضيحي — الأرقام تتغيّر حسب سعرك واختيارك للمنتج.
        </p>
      </div>

      {/* أصناف السوق */}
      <p className="mb-4 text-sm font-bold text-gray-700">أصناف رائجة في سوق المنتجات</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {marketCategories.map((c) => (
          <div
            key={c.iconId}
            className="group flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-violet-100 hover:shadow-[0_4px_18px_rgba(124,58,237,0.08)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
              {iconMap[c.iconId]}
            </div>
            <span className="min-w-0 text-[12.5px] font-semibold text-gray-700">{c.name}</span>
          </div>
        ))}
      </div>

    </section>
  )
}
