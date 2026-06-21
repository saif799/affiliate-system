// ─── src/routes/-components/landing/StepsSection.tsx ───

import { steps } from '../../-data/landing.data'

export function StepsSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-285 px-4 py-12 sm:px-6 lg:px-12 lg:py-16">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          كيفية العمل
        </span>
      </div>
      <h2 className="mb-3 text-[26px] font-black leading-tight text-gray-900 sm:text-[30px] lg:text-[34px]">
        من التسجيل إلى الربح<br />في 3 خطوات فقط
      </h2>
      <p className="mb-10 max-w-130 text-[15px] leading-[1.7] text-gray-500">
        النظام مصمم ليكون بسيطاً للغاية — بدون تعقيدات تقنية أو وساطة مكلفة.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.num}
            className="rounded-xl border border-gray-100 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[0_2px_20px_rgba(124,58,237,0.08)]"
          >
            <div className="mb-4 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-violet-600 text-[15px] font-black text-white">
              {step.num}
            </div>
            <h3 className="mb-2 text-base font-extrabold text-gray-900">{step.title}</h3>
            <p className="text-[13.5px] leading-[1.65] text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>

    </section>
  )
}