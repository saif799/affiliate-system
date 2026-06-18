import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Package, Play, CheckCircle2, Phone, MapPin, User, Loader2, Home, Building2,
  ChevronLeft, ChevronRight, ExternalLink, Link2, ShieldCheck, Truck,
} from 'lucide-react'
import {
  getPublicLanding,
  getPublicOffices,
  createPublicOrder,
  type LandingOffice,
} from '#/server/landing/landing.api'

export const Route = createFileRoute('/p/$slug')({
  loader: ({ params }) => getPublicLanding({ data: { slug: params.slug } }),
  component: LandingPage,
})

const dz = (n: number) => n.toLocaleString('ar-DZ')

function LandingPage() {
  const landing = Route.useLoaderData()
  const { slug } = Route.useParams()

  const [active, setActive] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [wilayaCode, setWilayaCode] = useState(0)
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home')
  const [offices, setOffices] = useState<LandingOffice[]>([])
  const [officeId, setOfficeId] = useState('')
  const [address, setAddress] = useState('')
  const [loadingOffices, setLoadingOffices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // حمّل بلديات الولاية عند اختيارها
  useEffect(() => {
    if (!wilayaCode) {
      setOffices([])
      setOfficeId('')
      return
    }
    let active = true
    setLoadingOffices(true)
    getPublicOffices({ data: { wilayaCode } })
      .then((rows) => {
        if (!active) return
        setOffices(rows)
        setOfficeId('')
      })
      .catch(() => active && setOffices([]))
      .finally(() => active && setLoadingOffices(false))
    return () => {
      active = false
    }
  }, [wilayaCode])

  if (!landing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6" dir="rtl">
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Package size={22} />
          </div>
          <h1 className="text-base font-bold text-gray-900">الرابط غير متاح</h1>
          <p className="mt-1 text-sm text-gray-500">هذا المنتج لم يعد متوفّراً أو أن الرابط منتهٍ.</p>
        </div>
      </div>
    )
  }

  const accent = landing.accent
  const selWilaya = landing.wilayas.find((w) => w.code === wilayaCode) || null
  const visibleOffices = deliveryType === 'office' ? offices.filter((o) => o.hasStopDesk) : offices
  const baseDelivery = selWilaya
    ? deliveryType === 'office'
      ? selWilaya.officePrice
      : selWilaya.homePrice
    : 0
  const freeForType = deliveryType === 'office' ? landing.freeOffice : landing.freeHome
  const deliveryShown = freeForType ? 0 : baseDelivery
  const total = landing.price + deliveryShown
  const images = landing.images
  const multi = images.length > 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    if (!wilayaCode || !officeId) {
      setError('اختر الولاية والبلدية')
      return
    }
    if (deliveryType === 'home' && !address.trim()) {
      setError('العنوان مطلوب للتوصيل المنزلي')
      return
    }
    setSubmitting(true)
    try {
      await createPublicOrder({
        data: {
          slug,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          wilayaCode,
          officeId,
          deliveryType,
          address: deliveryType === 'home' ? address.trim() : undefined,
        },
      })
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إرسال الطلب — حاول مجدداً')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6" dir="rtl">
      <div className="mx-auto grid max-w-4xl gap-5 px-4 md:grid-cols-2">
        {/* ── الوسائط ── */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {images.length > 0 ? (
              <img src={images[active]} alt={landing.title} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
              >
                <Package size={64} strokeWidth={1.2} />
              </div>
            )}
            {landing.category && (
              <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm" style={{ color: accent }}>
                {landing.category}
              </span>
            )}
            {multi && (
              <>
                <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] text-white">{active + 1} / {images.length}</span>
                <button onClick={() => setActive((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55" aria-label="السابق"><ChevronRight size={18} /></button>
                <button onClick={() => setActive((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55" aria-label="التالي"><ChevronLeft size={18} /></button>
              </>
            )}
          </div>

          {multi && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${active === i ? '' : 'border-gray-200 opacity-70 hover:opacity-100'}`} style={active === i ? { borderColor: accent } : {}}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {landing.videoUrl && (
            <a href={landing.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white" style={{ backgroundColor: accent }}>
              <Play size={15} className="ml-0.5" /> مشاهدة فيديو المنتج
            </a>
          )}
          {landing.links.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Link2 size={13} className="shrink-0 text-gray-400" />
              <span className="truncate" dir="ltr">{url}</span>
              <ExternalLink size={12} className="mr-auto shrink-0 text-gray-300" />
            </a>
          ))}
        </div>

        {/* ── المعلومات + الطلب ── */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold leading-snug text-gray-900">{landing.title}</h1>
            <p className="mt-1 text-xs text-gray-400">{landing.merchantName}</p>
          </div>

          {/* السعر */}
          {landing.enabled && (
            <div className="rounded-2xl p-4 text-white shadow-sm" style={{ background: `linear-gradient(to left, ${accent}, ${accent}cc)` }}>
              <p className="text-xs text-white/80">السعر</p>
              <p className="text-3xl font-extrabold">{dz(landing.price)} <span className="text-base font-bold text-white/80">د.ج</span></p>
              {(landing.freeOffice || landing.freeHome) && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
                  <Truck size={11} /> توصيل مجاني {landing.freeOffice && landing.freeHome ? '' : landing.freeOffice ? 'للمكتب' : 'للمنزل'}
                </p>
              )}
            </div>
          )}

          {landing.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{landing.description}</p>
          )}

          {!landing.enabled ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
              <p className="text-sm font-medium text-amber-800">هذه الصفحة غير منشورة بعد.</p>
              <p className="mt-1 text-xs text-amber-600">تواصل مع البائع للحصول على رابط الطلب.</p>
            </div>
          ) : done ? (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-center">
              <CheckCircle2 size={36} className="mx-auto text-green-500" />
              <h2 className="mt-2 text-base font-bold text-green-800">تم استلام طلبك!</h2>
              <p className="mt-1 text-sm text-green-700">سنتواصل معك هاتفياً لتأكيد الطلب والتوصيل.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900">اطلب الآن — الدفع عند الاستلام</p>

              <FieldIcon icon={User}>
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="الاسم الكامل" className="w-full border-0 bg-transparent py-2.5 text-sm outline-none focus:ring-0" />
              </FieldIcon>
              <FieldIcon icon={Phone}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" dir="ltr" pattern="0[5-7][0-9]{8}" maxLength={10} title="رقم جزائري: 10 أرقام يبدأ بـ 05/06/07" placeholder="0xxxxxxxxx" className="w-full border-0 bg-transparent py-2.5 text-right text-sm outline-none focus:ring-0" />
              </FieldIcon>

              {/* الولاية */}
              <FieldIcon icon={MapPin}>
                <select value={wilayaCode} onChange={(e) => setWilayaCode(Number(e.target.value))} required className="w-full border-0 bg-transparent py-2.5 text-sm outline-none focus:ring-0">
                  <option value={0}>اختر الولاية</option>
                  {landing.wilayas.map((w) => (
                    <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
                  ))}
                </select>
              </FieldIcon>

              {/* نوع التوصيل */}
              <div className="grid grid-cols-2 gap-2">
                <DeliveryType icon={Home} label="إلى المنزل" on={deliveryType === 'home'} accent={accent} onClick={() => setDeliveryType('home')} />
                <DeliveryType icon={Building2} label="إلى المكتب" on={deliveryType === 'office'} accent={accent} onClick={() => setDeliveryType('office')} />
              </div>

              {/* البلدية / المكتب */}
              <FieldIcon icon={MapPin}>
                <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} required disabled={!wilayaCode || loadingOffices} className="w-full border-0 bg-transparent py-2.5 text-sm outline-none focus:ring-0 disabled:text-gray-400">
                  <option value="">{!wilayaCode ? 'اختر الولاية أولاً' : loadingOffices ? 'جارٍ التحميل…' : deliveryType === 'office' ? 'اختر مكتب الاستلام' : 'اختر البلدية'}</option>
                  {visibleOffices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </FieldIcon>
              {deliveryType === 'office' && wilayaCode && !loadingOffices && visibleOffices.length === 0 && (
                <p className="text-[11px] text-amber-600">لا يوجد مكتب استلام في هذه الولاية — اختر التوصيل للمنزل.</p>
              )}

              {/* العنوان للمنزل */}
              {deliveryType === 'home' && (
                <FieldIcon icon={Home}>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان الكامل" className="w-full border-0 bg-transparent py-2.5 text-sm outline-none focus:ring-0" />
                </FieldIcon>
              )}

              {/* ملخص السعر */}
              {selWilaya && (
                <div className="rounded-xl bg-gray-50 p-3 text-sm">
                  <Row label="سعر المنتج" value={`${dz(landing.price)} د.ج`} />
                  <Row label="التوصيل" value={freeForType ? 'مجاني' : `${dz(baseDelivery)} د.ج`} valueClass={freeForType ? 'text-green-600 font-semibold' : ''} />
                  <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-2 font-bold">
                    <span>الإجمالي</span>
                    <span style={{ color: accent }}>{dz(total)} د.ج</span>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50" style={{ backgroundColor: accent }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {submitting ? 'جارٍ الإرسال…' : 'تأكيد الطلب'}
              </button>
              <p className="flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
                <ShieldCheck size={12} /> الدفع عند الاستلام — بياناتك آمنة
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldIcon({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3">
      <Icon size={15} className="shrink-0 text-gray-400" />
      {children}
    </label>
  )
}

function DeliveryType({ icon: Icon, label, on, accent, onClick }: { icon: typeof Home; label: string; on: boolean; accent: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-medium transition-colors ${on ? 'text-white' : 'border-gray-200 bg-white text-gray-600'}`} style={on ? { backgroundColor: accent, borderColor: accent } : {}}>
      <Icon size={14} /> {label}
    </button>
  )
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-gray-600">
      <span className="text-gray-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
