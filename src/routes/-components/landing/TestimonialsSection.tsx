// ─── src/routes/-components/landing/TestimonialsSection.tsx ───

import { testimonials } from '../../-data/landing.data'

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="mx-auto max-w-285 px-12 py-16">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          قصص نجاح
        </span>
      </div>
      <h2 className="mb-10 text-[34px] font-black leading-tight text-gray-900">
        يثقون بنا ويشاركون<br />تجاربهم
      </h2>

      <div className="grid grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-3 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" fill="#FBBF24" className="h-4 w-4">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>

            <div className="mb-2 select-none font-serif text-[32px] leading-none text-violet-200">"</div>

            <p className="mb-5 flex-1 text-[13.5px] leading-[1.75] text-gray-600">{t.text}</p>

            <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${t.avatarBg} text-[11px] font-black tracking-wide text-white shadow-sm`}
              >
                {t.initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-gray-900">{t.name}</div>
                <div className="text-[11.5px] text-gray-400">{t.role}</div>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${t.tagColor}`}>
                {t.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}