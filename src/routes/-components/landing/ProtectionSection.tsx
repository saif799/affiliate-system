// ─── src/routes/-components/landing/ProtectionSection.tsx ───
//
// قسم الحماية — يؤكّد أنّ المنصّة تحمي طرفيها. تركيز خاصّ على حماية المسوّق
// (نسبة الطلب/attribution + ضمان العمولة) إلى جانب حماية التاجر. كل النقاط
// تعكس ميزات موجودة فعلاً في المنصّة.

import {
  ShieldCheck,
  Fingerprint,
  Wallet,
  Scale,
  PackageSearch,
  Tag,
  RotateCcw,
  Truck,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { affiliateProtections, merchantProtections } from '../../-data/landing.data'

const iconMap: Record<string, LucideIcon> = {
  attribution: Fingerprint,
  wallet: Wallet,
  scale: Scale,
  track: PackageSearch,
  price: Tag,
  return: RotateCcw,
  truck: Truck,
  chart: BarChart3,
}

interface Item {
  iconId: string
  title: string
  text: string
}

function ProtectionList({ items, dark }: { items: Item[]; dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const Icon = iconMap[item.iconId] ?? ShieldCheck
        return (
          <li key={item.title} className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                dark ? 'bg-white/15 text-white' : 'bg-violet-50 text-violet-600'
              }`}
            >
              <Icon size={17} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p
                className={`text-[14px] font-bold ${dark ? 'text-white' : 'text-gray-900'}`}
              >
                {item.title}
              </p>
              <p
                className={`mt-0.5 text-[13px] leading-[1.65] ${dark ? 'text-white/70' : 'text-gray-500'}`}
              >
                {item.text}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ProtectionSection() {
  return (
    <section
      id="protection"
      className="mx-auto max-w-285 px-4 py-12 sm:px-6 lg:px-12 lg:py-16"
    >
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
        <ShieldCheck size={14} className="text-violet-600" />
        <span className="text-xs font-extrabold uppercase tracking-wide text-violet-600">
          الحماية أولاً
        </span>
      </div>
      <h2 className="mb-3 text-[26px] font-black leading-tight text-gray-900 sm:text-[30px] lg:text-[34px]">
        منصّة تحمي طرفيها —<br />المسوّق والتاجر
      </h2>
      <p className="mb-10 max-w-150 text-[15px] leading-[1.7] text-gray-500">
        حقّ كل طرف مصون من أوّل طلب: طلبات المسوّق محميّة وعمولته مضمونة، وسعر
        التاجر وأرباحه محفوظة. نحن نحمي زبائننا — تاجراً كان أو مسوّقاً.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-7">

        {/* ── حماية المسوّق (مميّزة) ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-violet-900 p-6 shadow-[0_8px_40px_rgba(76,29,149,0.22)] sm:p-8">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <ShieldCheck size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-white/55">
                نحمي المسوّق
              </p>
              <h3 className="text-[19px] font-black text-white">طلباتك مضمونة</h3>
            </div>
          </div>
          <ProtectionList items={affiliateProtections} dark />
        </div>

        {/* ── حماية التاجر ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldCheck size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                نحمي التاجر
              </p>
              <h3 className="text-[19px] font-black text-gray-900">حقوقك مصونة</h3>
            </div>
          </div>
          <ProtectionList items={merchantProtections} />
        </div>

      </div>
    </section>
  )
}
