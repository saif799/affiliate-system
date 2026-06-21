// ─── src/routes/-components/landing/LandingNav.tsx ───

import { navLinks } from '../../-data/landing.data'

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between gap-3 border-b border-violet-100/60 bg-[#fafaf7]/90 px-4 backdrop-blur-md sm:h-17 sm:px-6 lg:px-12">

      {/* Logo */}
      <a href="/" className="shrink-0 text-[20px] font-black tracking-tight text-violet-900 no-underline sm:text-[22px]">
        Dz<span className="text-violet-600">Affilio</span>
      </a>

      {/* Links — كلها <a> حقيقية مع href مطابق لـ id كل section (مخفية على الجوال) */}
      <div className="hidden gap-6 lg:flex lg:gap-8">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-[13.5px] font-semibold text-gray-500 no-underline transition-colors hover:text-violet-600"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <a
          href="/login"
          className="hidden text-[13px] font-semibold text-gray-500 no-underline transition-colors hover:text-violet-600 sm:inline"
        >
          تسجيل الدخول
        </a>
        <div className="hidden h-4 w-px bg-gray-200 sm:block" />
        <a
          href="/register"
          className="whitespace-nowrap rounded-full bg-violet-600 px-4 py-2 text-[13px] font-bold text-white no-underline shadow-[0_2px_12px_rgba(124,58,237,0.3)] transition-all hover:-translate-y-0.5 hover:bg-violet-800 sm:px-6 sm:py-2.5"
        >
          ابدأ مجاناً ←
        </a>
      </div>

    </nav>
  )
}