import { useEffect, useState } from 'react'
import {
  X,
  Phone,
  MapPin,
  Store,
  Package,
  Truck,
  CheckCircle2,
  Building2,
  User,
  Send,
  MessageSquare,
  Headset,
  Hash,
  ClipboardList,
} from 'lucide-react'
import type { AffiliateOrder } from '../-orders.types'
import {
  getOrderTracking,
  getOrderDeliveryDetails,
  getOrderComments,
  addOrderComment,
} from '#/server/delivery/tracking.api'
import type {
  TrackingEventView,
  OrderDeliveryDetails,
  OrderCommentView,
} from '#/server/delivery/tracking.api'
import { DeliveryTimeline } from '#/routes/-components/shared/DeliveryTimeline'

interface Props {
  order: AffiliateOrder | null
  onClose: () => void
  onConfirm: (rawId: string) => void
  onReject: (rawId: string) => void
  busy: boolean
}

type Tab = 'overview' | 'delivery' | 'comments'

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'بانتظار التأكيد', cls: 'bg-amber-400/20 text-amber-50 ring-1 ring-amber-200/40' },
  shipping: { label: 'قيد الشحن', cls: 'bg-blue-400/20 text-blue-50 ring-1 ring-blue-200/40' },
  delivered: { label: 'مُسلّمة', cls: 'bg-green-400/20 text-green-50 ring-1 ring-green-200/40' },
  returned: { label: 'مرتجعة', cls: 'bg-red-400/25 text-red-50 ring-1 ring-red-200/40' },
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function roleLabel(role: string): string {
  return role === 'super_admin'
    ? 'الإدارة'
    : role === 'merchant'
      ? 'التاجر'
      : role === 'affiliate'
        ? 'أنت'
        : role
}

// بطاقة معلومة موحّدة (أيقونة + عنوان + محتوى)
function InfoCard({
  icon: Icon,
  title,
  accent = 'gray',
  children,
}: {
  icon: typeof User
  title: string
  accent?: 'gray' | 'violet' | 'blue' | 'green'
  children: React.ReactNode
}) {
  const chip = {
    gray: 'bg-gray-100 text-gray-500',
    violet: 'bg-violet-100 text-violet-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
  }[accent]
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${chip}`}>
          <Icon size={14} />
        </span>
        <p className="text-xs font-semibold text-gray-600">{title}</p>
      </div>
      {children}
    </div>
  )
}

export function OrderDetailsModal({ order, onClose, onConfirm, onReject, busy }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [events, setEvents] = useState<TrackingEventView[]>([])
  const [delivery, setDelivery] = useState<OrderDeliveryDetails | null>(null)
  const [comments, setComments] = useState<OrderCommentView[]>([])
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!order) {
      setEvents([])
      setDelivery(null)
      setComments([])
      setTab('overview')
      return
    }
    let active = true
    const id = order.rawId
    getOrderTracking({ data: { orderId: id } })
      .then((rows) => active && setEvents(rows))
      .catch(() => active && setEvents([]))
    getOrderDeliveryDetails({ data: { orderId: id } })
      .then((d) => active && setDelivery(d))
      .catch(() => active && setDelivery(null))
    getOrderComments({ data: { orderId: id } })
      .then((c) => active && setComments(c))
      .catch(() => active && setComments([]))
    return () => {
      active = false
    }
  }, [order])

  async function handleSendComment() {
    if (!order || !commentText.trim() || sending) return
    setSending(true)
    try {
      await addOrderComment({ data: { orderId: order.rawId, body: commentText.trim() } })
      setCommentText('')
      const rows = await getOrderComments({ data: { orderId: order.rawId } })
      setComments(rows)
    } catch {
      /* تجاهل — تبقى الرسالة في الحقل ليُعيد المحاولة */
    } finally {
      setSending(false)
    }
  }

  if (!order) return null

  const isReturned = order.dbStatus === 'returned'
  const pill = STATUS_PILL[order.status] ?? STATUS_PILL.pending

  const steps = [
    { key: 'created', label: 'وصلت الطلبية', sub: 'من متجرك الخارجي', icon: Package, ts: order.createdAt },
    { key: 'confirmed', label: 'أُرسلت للتاجر', sub: order.merchantName, icon: Store, ts: order.confirmedAt },
    {
      key: 'shipped',
      label: 'التاجر شحنها',
      sub: order.trackingNumber ? `تتبّع: ${order.trackingNumber}` : 'سُلّمت لشركة التوصيل',
      icon: Package,
      ts: order.shippedAt,
    },
    { key: 'at_wilaya', label: 'في الطريق', sub: 'مركز شركة التوصيل بالولاية', icon: Truck, ts: order.atWilayaAt },
    { key: 'delivered', label: 'استلمها الزبون', sub: 'اكتملت الطلبية', icon: CheckCircle2, ts: order.deliveredAt },
  ]
  const lastDone = steps.reduce((acc, s, i) => (s.ts ? i : acc), 0)

  const TABS: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'overview', label: 'نظرة عامة', icon: ClipboardList },
    { key: 'delivery', label: 'التوصيل والتتبّع', icon: Truck },
    { key: 'comments', label: `الملاحظات${comments.length ? ` (${comments.length})` : ''}`, icon: MessageSquare },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl">
        {/* Header (gradient) */}
        <div className="relative bg-gradient-to-l from-violet-700 to-violet-500 px-5 py-4 text-white">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-xs text-violet-100">
              <Hash size={12} /> {order.id}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.cls}`}>
              {pill.label}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold">{order.product}</h2>
          <p className="text-xs text-violet-100">
            {order.date} · الكمية {order.quantity}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 bg-white px-3 pt-2">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ───────────── نظرة عامة ───────────── */}
          {tab === 'overview' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard icon={User} title="الزبون" accent="blue">
                  <p className="text-sm font-medium text-gray-900">{order.customer}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500" dir="ltr">
                    <Phone size={11} /> {order.phone}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} /> {order.wilaya}
                  </p>
                </InfoCard>

                <InfoCard icon={Store} title="المنتج والتاجر" accent="gray">
                  <p className="text-sm font-medium text-gray-900">{order.product}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <Store size={11} /> {order.merchantName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">SKU: {order.sku}</p>
                </InfoCard>
              </div>

              {/* Money */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
                  <p className="text-[11px] text-gray-400">سعر البيع</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">
                    {order.price.toLocaleString('ar-DZ')} د.ج
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
                  <p className="text-[11px] text-gray-400">سعر الجملة</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-700">
                    {(order.basePrice * order.quantity).toLocaleString('ar-DZ')} د.ج
                  </p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center shadow-sm">
                  <p className="text-[11px] text-violet-500">ربحك</p>
                  <p className="mt-0.5 text-sm font-bold text-violet-700">
                    {order.commission.toLocaleString('ar-DZ')} د.ج
                  </p>
                </div>
              </div>

              {isReturned && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  ⚠️ هذه الطلبية مُرتجعة — لم يستلمها الزبون.
                </div>
              )}

              {/* Journey */}
              {!isReturned && (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold text-gray-600">رحلة الطلبية</p>
                  <div className="relative">
                    {steps.map((s, i) => {
                      const done = !!s.ts
                      const isCurrent = i === lastDone
                      const Icon = s.icon
                      return (
                        <div key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                          {i < steps.length - 1 && (
                            <span
                              className={`absolute right-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${
                                steps[i + 1].ts ? 'bg-violet-400' : 'bg-gray-200'
                              }`}
                            />
                          )}
                          <div
                            className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              done
                                ? isCurrent
                                  ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                                  : 'bg-violet-500 text-white'
                                : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="pt-1">
                            <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                              {s.label}
                            </p>
                            <p className="text-xs text-gray-400">{s.sub}</p>
                            {s.ts && (
                              <p className="mt-0.5 text-[11px] text-violet-500">{fmtDateTime(s.ts)}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────── التوصيل والتتبّع ───────────── */}
          {tab === 'delivery' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* المكتب / نوع التوصيل */}
                <InfoCard
                  icon={Building2}
                  title={delivery?.deliveryType === 'office' ? 'مكتب الاستلام (stop-desk)' : 'توصيل إلى المنزل'}
                  accent="gray"
                >
                  {delivery?.office ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{delivery.office.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={11} />
                        {delivery.wilaya}
                        {delivery.office.postalCode ? ` — ${delivery.office.postalCode}` : ''}
                      </p>
                      {delivery.office.hasStopDesk && (
                        <p className="mt-1 text-[11px] text-green-600">✓ يتوفّر الاستلام من المكتب</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        {delivery?.commune ?? order.wilaya}
                      </p>
                      {delivery?.address && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin size={11} /> {delivery.address}
                        </p>
                      )}
                    </>
                  )}
                </InfoCard>

                {/* عامل التوصيل */}
                <InfoCard icon={Headset} title="عامل التوصيل" accent="violet">
                  {delivery?.driver ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{delivery.driver}</p>
                      {delivery.driverPhone ? (
                        <a
                          href={`tel:${delivery.driverPhone}`}
                          className="mt-1 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:underline"
                          dir="ltr"
                        >
                          <Phone size={11} /> {delivery.driverPhone}
                        </a>
                      ) : (
                        <p className="mt-1 text-[11px] text-gray-400">رقم الهاتف غير متاح من شركة التوصيل</p>
                      )}
                      {delivery.currentStation && (
                        <p className="mt-1 text-xs text-gray-500">المحطة الحالية: {delivery.currentStation}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {delivery?.trackingNumber ? 'لم يُسنَد موزّع للطلبية بعد' : 'لم تُشحَن الطلبية بعد'}
                    </p>
                  )}
                </InfoCard>
              </div>

              {/* تلميح: ملاحظات شركة التوصيل صارت تُعرض في تبويب «الملاحظات» مع تعليقاتك */}
              {delivery && delivery.carrierNotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTab('comments')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-2.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
                >
                  <MessageSquare size={13} />
                  لديك {delivery.carrierNotes.length} ملاحظة من شركة التوصيل — اعرضها في تبويب الملاحظات
                </button>
              )}

              {/* أحداث شركة التوصيل (ECOTRACK) */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-gray-600">تتبّع شركة التوصيل</p>
                {events.length > 0 ? (
                  <DeliveryTimeline events={events} />
                ) : (
                  <p className="text-xs text-gray-400">لا توجد أحداث تتبّع من شركة التوصيل بعد</p>
                )}
              </div>
            </div>
          )}

          {/* ───────────── الملاحظات (شركة التوصيل + تعليقاتك) ───────────── */}
          {tab === 'comments' && (
            <div className="flex flex-col gap-3">
              {/* ملاحظات شركة التوصيل — للقراءة فقط، من سجلّ نشاط ECOTRACK */}
              {delivery && delivery.carrierNotes.length > 0 && (
                <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <Headset size={13} className="text-violet-500" />
                    ملاحظات شركة التوصيل
                  </p>
                  <div className="flex flex-col gap-2">
                    {delivery.carrierNotes.map((nt, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2"
                      >
                        <p className="whitespace-pre-wrap text-sm text-gray-800">{nt.text}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                          <span className="rounded-full bg-white px-1.5 py-0.5 font-medium text-violet-600">
                            شركة التوصيل
                          </span>
                          {nt.by && <span>{nt.by}</span>}
                          {nt.at && <span>{fmtDateTime(nt.at)}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* خيط ملاحظاتك وتعليقاتك */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <MessageSquare size={13} /> ملاحظاتك وتعليقاتك على الطلبية
                </p>
                <div className="flex flex-col gap-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-400">لا توجد تعليقات بعد — أضِف ملاحظتك أدناه.</p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className={`rounded-xl px-3 py-2 ${c.isMine ? 'bg-violet-50' : 'bg-gray-50'}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">{c.authorName}</span>
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-gray-400">
                            {roleLabel(c.authorRole)}
                          </span>
                          <span className="text-[10px] text-gray-400">{fmtDateTime(c.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    placeholder="اكتب ملاحظة أو تعليقاً على الطلبية..."
                    className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                  <button
                    type="button"
                    onClick={handleSendComment}
                    disabled={sending || !commentText.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
                    aria-label="إرسال التعليق"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions — للطلبيات بانتظار التأكيد */}
        {order.needsAction && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3">
            <button
              onClick={() => onReject(order.rawId)}
              disabled={busy}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
            >
              رفض
            </button>
            <button
              onClick={() => onConfirm(order.rawId)}
              disabled={busy}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-40"
            >
              {busy ? 'جارٍ…' : 'تأكيد وإرسال للتاجر'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
