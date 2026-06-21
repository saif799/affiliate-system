// ─── src/routes/-components/landing/DualValueSection.tsx ───

import { merchantFeatures, affiliateFeatures } from '../../-data/landing.data'

function CheckIcon({ dark }: { dark?: boolean }) {
  return (
    <span
      className={`mt-px flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] ${
        dark ? 'bg-white/20 text-white' : 'bg-yellow-200/60 text-yellow-700'
      }`}
    >
      ✓
    </span>
  )
}

export function DualValueSection() {
  return (
    <section className="mx-auto max-w-285 px-4 py-12 sm:px-6 lg:px-12 lg:py-16">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          للجميع
        </span>
      </div>
      <h2 className="mb-3 text-[26px] font-black leading-tight text-gray-900 sm:text-[30px] lg:text-[34px]">
        منصة واحدة — قيمتان حقيقيتان
      </h2>
      <p className="mb-10 max-w-130 text-[15px] leading-[1.7] text-gray-500">
        سواء كنت تاجراً أو مسوقاً، DzAffilio مصممة لتحقق لك أقصى استفادة.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-7">

        {/* ── Merchant Card ── */}
        <div id="merchants" className="relative overflow-hidden rounded-xl bg-violet-900 p-6 sm:p-8">
          <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-white/50">
            للتجار والموردين
          </p>
          <h3 className="mb-2 text-[22px] font-black text-white">
            وسّع مبيعاتك بجيش تسويقي
          </h3>
          <p className="mb-6 text-[13.5px] leading-[1.7] text-white/65">
            لا تحتاج فريق تسويق داخلي. آلاف المسوقين يروّجون لمنتجاتك مقابل عمولة فقط عند البيع.
          </p>
          <ul className="flex flex-col gap-2.5">
            {merchantFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/80">
                <CheckIcon dark />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/register?type=merchant"
            className="mt-6 inline-block rounded-full bg-white/15 px-6 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-white/25"
          >
            ابدأ كتاجر الآن ←
          </a>
        </div>

        {/* ── Affiliate Card ── */}
        <div id="affiliates" className="relative overflow-hidden rounded-xl border border-yellow-200/50 bg-yellow-50 p-8">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-yellow-600">
            للمسوقين
          </p>
          <h3 className="mb-2 text-[22px] font-black text-gray-900">
            اكسب بحرية — بدون قيود
          </h3>
          <p className="mb-6 text-[13.5px] leading-[1.7] text-gray-500">
            اختر المنتجات التي تناسب جمهورك، روّج لها بأسلوبك، واقبض عمولتك فور تأكيد التوصيل.
          </p>
          <ul className="flex flex-col gap-2.5">
            {affiliateFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-gray-800">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/register?type=affiliate"
            className="mt-6 inline-block rounded-full bg-yellow-500 px-6 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-yellow-600"
          >
            انضم كمسوق مجاناً ←
          </a>
        </div>

      </div>
    </section>
  )
}