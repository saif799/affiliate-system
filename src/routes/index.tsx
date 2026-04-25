// ─── src/routes/index.tsx ───

import { createFileRoute } from '@tanstack/react-router'

import { LandingNav }          from './-components/landing/LandingNav'
import { HeroSection }         from './-components/landing/HeroSection'
import { TickerBanner }        from './-components/landing/TickerBanner'
import { StatsSection }        from './-components/landing/StatsSection'
import { StepsSection }        from './-components/landing/StepsSection'
import { DualValueSection }    from './-components/landing/DualValueSection'
import { WilayasSection }      from './-components/landing/WilayasSection'
import { CommissionsSection }  from './-components/landing/CommissionsSection'
import { TestimonialsSection } from './-components/landing/TestimonialsSection'
import { CtaSection }          from './-components/landing/CtaSection'
import { LandingFooter }       from './-components/landing/LandingFooter'

// ── Route Definition ──────────────────────────────────────────────────────────
export const Route = createFileRoute('/')({
  component: LandingPage,
})

// ── Component ─────────────────────────────────────────────────────────────────
function LandingPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen font-sans"
      style={{ background: '#FAFAF7' }}
    >
      {/* ── Navigation ── */}
      <LandingNav />

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Ticker ── */}
      <TickerBanner />

      {/* ── Platform Stats ── */}
      <StatsSection />

      {/* ── How it Works ── */}
      <StepsSection />

      {/* ── Merchant vs Affiliate ── */}
      <DualValueSection />

      {/* ── Wilayas Coverage ── */}
      <WilayasSection />

      {/* ── Commissions Grid ── */}
      <CommissionsSection />

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Final CTA ── */}
      <CtaSection />

      {/* ── Footer ── */}
      <LandingFooter />
    </div>
  )
}