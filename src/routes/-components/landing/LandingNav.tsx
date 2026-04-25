// ─── src/routes/-components/landing/LandingNav.tsx ───

import { navLinks } from '../../-data/landing.data'

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 flex h-17 items-center justify-between border-b border-violet-100/60 bg-[#fafaf7]/90 px-12 backdrop-blur-md">

      {/* Logo */}
      <a href="/" className="text-[22px] font-black tracking-tight text-violet-900 no-underline">
        Dz<span className="text-violet-600">Drop</span>
      </a>

      {/* Links — كلها <a> حقيقية مع href مطابق لـ id كل section */}
      <div className="flex gap-8">
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
      <div className="flex items-center gap-4">
        <a
          href="/login"
          className="text-[13px] font-semibold text-gray-500 no-underline transition-colors hover:text-violet-600"
        >
          تسجيل الدخول
        </a>
        <div className="h-4 w-px bg-gray-200" />
        <a
          href="/register"
          className="rounded-full bg-violet-600 px-6 py-2.5 text-[13px] font-bold text-white no-underline shadow-[0_2px_12px_rgba(124,58,237,0.3)] transition-all hover:-translate-y-0.5 hover:bg-violet-800"
        >
          ابدأ مجاناً ←
        </a>
      </div>

    </nav>
  )
}