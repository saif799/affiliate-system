// ─── src/routes/-components/landing/CtaSection.tsx ───

export function CtaSection() {
  return (
    <div className="px-4 pb-0 sm:px-6 lg:px-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-violet-700 to-violet-500 px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16 lg:py-[72px] mb-5">

        {/* Decoration circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/4" />

        <h2 className="relative mb-3.5 text-[26px] font-black leading-tight text-white sm:text-[32px] lg:text-[38px]">
          الجزائر تتحرك — هل أنت معها؟
        </h2>
        <p className="relative mx-auto mb-9 max-w-[480px] text-[15px] leading-[1.7] text-white/70">
          انضم إلى أكثر من 20,000 مسوق و500 تاجر يبنون مستقبلهم المالي اليوم.
          التسجيل مجاني والانطلاق فوري.
        </p>

        <div className="relative flex flex-wrap justify-center gap-3.5">
          <button className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-violet-900 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.2)]">
            سجّل كتاجر — مجاناً ←
          </button>
          <button className="rounded-full border-[1.5px] border-white/30 bg-white/12 px-8 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/20">
            انضم كمسوق الآن ←
          </button>
        </div>

      </section>
    </div>
  )
}
