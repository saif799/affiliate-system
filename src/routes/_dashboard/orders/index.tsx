import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  getAdminOrders,
  flagOrderDispute,
  resolveOrderDispute,
} from './-server/orders.api'
import type { AdminOrder } from './-server/orders.api'
import { PageSpinner, PageError } from '#/routes/-components/shared/RouteStates'

export const Route = createFileRoute('/_dashboard/orders/')({
  loader: () => getAdminOrders(),
  pendingComponent: PageSpinner,
  errorComponent: PageError,
  component: AdminOrdersPage,
})

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'بانتظار المسوّق', cls: 'bg-gray-100 text-gray-600' },
  confirmed: { label: 'مؤكَّدة', cls: 'bg-amber-100 text-amber-700' },
  shipped: { label: 'مشحونة', cls: 'bg-blue-100 text-blue-700' },
  at_wilaya: { label: 'في الولاية', cls: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'مُسلَّمة', cls: 'bg-green-100 text-green-700' },
  returned: { label: 'مرتجعة', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'ملغاة', cls: 'bg-gray-100 text-gray-500' },
  disputed: { label: 'نزاع', cls: 'bg-purple-100 text-purple-700' },
}

const TERMINAL = new Set(['delivered', 'cancelled', 'disputed'])

// أزرار الإجراء — تُعاد استخدامها في الجدول (سطح المكتب) وفي البطاقات (الجوّال)
function OrderActions({
  order,
  busy,
  onResolve,
  onFlag,
}: {
  order: AdminOrder
  busy: boolean
  onResolve: (
    o: AdminOrder,
    resolution: 'delivered' | 'returned' | 'cancelled',
  ) => void
  onFlag: (o: AdminOrder) => void
}) {
  if (order.status === 'disputed') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onResolve(order, 'delivered')}
          disabled={busy}
          className="rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100 disabled:opacity-40"
        >
          مُسلَّمة
        </button>
        <button
          onClick={() => onResolve(order, 'returned')}
          disabled={busy}
          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
        >
          مرتجعة
        </button>
        <button
          onClick={() => onResolve(order, 'cancelled')}
          disabled={busy}
          className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
        >
          إلغاء
        </button>
      </div>
    )
  }
  if (TERMINAL.has(order.status)) {
    return <span className="text-xs text-gray-300">—</span>
  }
  return (
    <button
      onClick={() => onFlag(order)}
      disabled={busy}
      className="rounded-lg border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-40"
    >
      فتح نزاع
    </button>
  )
}

function AdminOrdersPage() {
  const { orders } = Route.useLoaderData()
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [flagTarget, setFlagTarget] = useState<AdminOrder | null>(null)
  const [flagNote, setFlagNote] = useState('')
  const [notifyTo, setNotifyTo] = useState<'affiliate' | 'merchant' | 'both'>(
    'both',
  )
  const [flagBusy, setFlagBusy] = useState(false)

  const filtered =
    statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === statusFilter)

  function openFlag(o: AdminOrder) {
    setFlagNote('')
    setNotifyTo('both')
    setFlagTarget(o)
  }

  async function submitFlag() {
    if (!flagTarget) return
    setFlagBusy(true)
    try {
      await flagOrderDispute({
        data: {
          orderId: flagTarget.id,
          note: flagNote.trim() || undefined,
          notifyTarget: notifyTo,
        },
      })
      setFlagTarget(null)
      await router.invalidate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'فشل فتح النزاع')
    } finally {
      setFlagBusy(false)
    }
  }

  async function handleResolve(
    o: AdminOrder,
    resolution: 'delivered' | 'returned' | 'cancelled',
  ) {
    setBusyId(o.id)
    try {
      await resolveOrderDispute({ data: { orderId: o.id, resolution } })
      await router.invalidate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'فشل حلّ النزاع')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">إدارة الطلبيات</h1>
        <p className="text-sm text-gray-500">عرض كل الطلبيات وإدارة النزاعات</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          'all',
          'disputed',
          'shipped',
          'at_wilaya',
          'delivered',
          'returned',
        ].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'الكل' : (STATUS_LABEL[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {/* ── بطاقات الجوّال (md:hidden) ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
            لا توجد طلبيات
          </div>
        ) : (
          filtered.map((o) => {
            const st = STATUS_LABEL[o.status] ?? {
              label: o.status,
              cls: 'bg-gray-100 text-gray-600',
            }
            const busy = busyId === o.id
            return (
              <div
                key={o.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900 break-words">
                    {o.productName}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div className="min-w-0">
                    <dt className="text-gray-400">التاجر</dt>
                    <dd className="truncate text-gray-700">{o.merchantName}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-gray-400">المسوّق</dt>
                    <dd className="truncate text-gray-700">
                      {o.affiliateName ?? '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-gray-400">الزبون</dt>
                    <dd className="truncate text-gray-700">{o.customerName}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-gray-400">الولاية</dt>
                    <dd className="truncate text-gray-500">{o.wilaya}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-50 pt-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {o.total.toLocaleString('ar-DZ')} د.ج
                  </span>
                  <OrderActions
                    order={o}
                    busy={busy}
                    onResolve={handleResolve}
                    onFlag={openFlag}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── جدول سطح المكتب (md:block) ── */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              {[
                'المنتج',
                'التاجر',
                'المسوّق',
                'الزبون',
                'الولاية',
                'المبلغ',
                'الحالة',
                'إجراء',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-medium text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  لا توجد طلبيات
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const st = STATUS_LABEL[o.status] ?? {
                  label: o.status,
                  cls: 'bg-gray-100 text-gray-600',
                }
                const busy = busyId === o.id
                return (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-xs text-gray-900">
                      {o.productName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {o.merchantName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {o.affiliateName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {o.customerName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {o.wilaya}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                      {o.total.toLocaleString('ar-DZ')} د.ج
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <OrderActions
                        order={o}
                        busy={busy}
                        onResolve={handleResolve}
                        onFlag={openFlag}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* نافذة فتح النزاع */}
      {flagTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) =>
            e.target === e.currentTarget && !flagBusy && setFlagTarget(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            dir="rtl"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-lg">
                ⚠️
              </span>
              <h2 className="text-base font-bold text-gray-900">
                فتح نزاع على الطلبية
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              ستُجمَّد الطلبية «{flagTarget.productName}» للزبون{' '}
              {flagTarget.customerName} وتُستبعَد من التدفّق العادي حتى تحلّها.
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              سبب النزاع <span className="text-gray-400">(اختياري)</span>
            </label>
            <textarea
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              rows={3}
              autoFocus
              placeholder="مثال: الزبون ينكر استلام الطرد رغم تسجيله مُسلَّماً…"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />

            <label className="mb-1.5 mt-4 block text-sm font-medium text-gray-700">
              إرسال الإشعار إلى
            </label>
            <div className="flex gap-2">
              {(
                [
                  { v: 'both', label: 'كلاهما' },
                  { v: 'affiliate', label: 'المسوّق' },
                  { v: 'merchant', label: 'التاجر' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setNotifyTo(opt.v)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    notifyTo === opt.v
                      ? 'border-purple-300 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setFlagTarget(null)}
                disabled={flagBusy}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-40"
              >
                إلغاء
              </button>
              <button
                onClick={submitFlag}
                disabled={flagBusy}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              >
                {flagBusy ? 'جارٍ الفتح…' : 'فتح النزاع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
