// ─── src/routes/-components/landing/TestimonialsSection.tsx ───
//
// «لماذا DzAffilio» — قيم حقيقية للمنصّة بدل شهادات مُختلَقة لأشخاص غير موجودين.

import {
  Banknote,
  MapPin,
  Wallet,
  TrendingUp,
  Languages,
  BadgeCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { whyUs } from '../../-data/landing.data'

const iconMap: Record<string, LucideIcon> = {
  cod: Banknote,
  map: MapPin,
  wallet: Wallet,
  margin: TrendingUp,
  lang: Languages,
  free: BadgeCheck,
}

export function TestimonialsSection() {
  return (
    <section id="why" className="mx-auto max-w-285 px-4 py-12 sm:px-6 lg:px-12 lg:py-16">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          لماذا DzAffilio
        </span>
      </div>
      <h2 className="mb-3 text-[26px] font-black leading-tight text-gray-900 sm:text-[30px] lg:text-[34px]">
        مبنيّة على واقع<br />السوق الجزائري
      </h2>
      <p className="mb-10 max-w-130 text-[15px] leading-[1.7] text-gray-500">
        كل ميزة هنا موجودة فعلاً في المنصّة — لا وعود فارغة.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {whyUs.map((item) => {
          const Icon = iconMap[item.iconId] ?? BadgeCheck
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-violet-100 hover:shadow-[0_4px_24px_rgba(124,58,237,0.08)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="mb-1.5 text-[15px] font-extrabold text-gray-900">
                {item.title}
              </h3>
              <p className="text-[13.5px] leading-[1.7] text-gray-500">{item.desc}</p>
            </div>
          )
        })}
      </div>

    </section>
  )
}
