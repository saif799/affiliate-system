import { useState } from 'react'
import type { Campaign, CampaignStatus } from '../campaigns.types'

interface Props {
  campaigns: Campaign[]
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active:    'نشط',
  pending:   'قيد المراجعة',
  suspended: 'موقوف',
  banned:    'محظور',
}

const STATUS_CLASS: Record<CampaignStatus, string> = {
  active:    'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  banned:    'bg-pink-100 text-pink-700',
}

function ReturnBar({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-xs text-gray-400">—</span>
  const color =
    rate >= 60 ? 'bg-red-500' : rate >= 35 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div>
      <span className={`text-xs font-medium ${rate >= 60 ? 'text-red-600' : 'text-gray-700'}`}>
        {rate}%
      </span>
      <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  )
}

type FilterStatus = CampaignStatus | 'all'

const FILTER_BUTTONS: { label: string; value: FilterStatus }[] = [
  { label: 'الكل',          value: 'all'       },
  { label: 'نشط',           value: 'active'    },
  { label: 'قيد المراجعة',  value: 'pending'   },
  { label: 'موقوف',         value: 'suspended' },
  { label: 'محظور',         value: 'banned'    },
]

export function CampaignsTable({ campaigns }: Props) {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selected, setSelected]       = useState<Campaign | null>(null)

  const filtered = campaigns.filter((c) => {
    const matchSearch =
      c.productName.includes(search) ||
      c.merchantName.toLowerCase().includes(search.toLowerCase()) ||
      c.merchantWilaya.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <>
      {/* ─── filters ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="flex-1 min-w-50 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          placeholder="ابحث باسم المنتج أو التاجر أو الولاية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          dir="rtl"
        />
        <div className="flex gap-2">
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterStatus(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── table ───────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-right">
              <th className="px-4 py-3 text-xs font-medium text-gray-400">المنتج / التاجر</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">العمولة</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">الحالة</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">التحويلات</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">المبيعات</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">نسبة الإرجاع</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 text-right last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                        {c.productName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{c.productName}</div>
                        <div className="text-xs text-gray-400">
                          {c.merchantName} — {c.merchantWilaya}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* commission */}
                  <td className="px-4 py-3 text-gray-700">{c.commissionRate}%</td>

                  {/* status */}
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>

                  {/* conversions */}
                  <td className="px-4 py-3 text-gray-700">
                    {c.conversions === 0 ? '—' : c.conversions}
                  </td>

                  {/* sales */}
                  <td className="px-4 py-3 text-gray-700">
                    {c.totalSales === 0
                      ? '—'
                      : c.totalSales.toLocaleString('fr-DZ') + ' DZD'}
                  </td>

                  {/* return rate */}
                  <td className="px-4 py-3">
                    <ReturnBar rate={c.returnRate} />
                  </td>

                  {/* actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelected(c)}
                        className="rounded-md border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
                      >
                        عرض
                      </button>
                      {c.status === 'pending' && (
                        <button type="button" className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                          اعتماد
                        </button>
                      )}
                      {c.status === 'active' && (
                        <button type="button" className="rounded-md bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200">
                          إيقاف
                        </button>
                      )}
                      {(c.status === 'active' || c.status === 'suspended') && (
                        <button type="button" className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200">
                          حظر
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── detail drawer ────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-start bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-96 overflow-y-auto bg-white p-6 shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {selected.productName}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                ['التاجر',             selected.merchantName],
                ['الولاية',            selected.merchantWilaya],
                ['العمولة',            `${selected.commissionRate}%`],
                ['التحويلات',          selected.conversions.toString()],
                ['إجمالي المبيعات',    selected.totalSales === 0 ? '—' : selected.totalSales.toLocaleString('fr-DZ') + ' DZD'],
                ['نسبة الإرجاع',       `${selected.returnRate}%`],
                ['المسوقون المشاركون', selected.affiliatesCount.toString()],
                ['تاريخ الإنشاء',      selected.createdAt],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}

              {/* status badge */}
              <div className="flex justify-between border-b border-gray-50 pb-2 text-sm">
                <span className="text-gray-400">الحالة</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[selected.status]}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              {/* suspend reason */}
              {selected.suspendReason && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  <span className="font-medium">سبب الإيقاف: </span>
                  {selected.suspendReason}
                </div>
              )}

              {/* return rate warning */}
              {selected.returnRate >= 40 && (
                <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                  ⚠️ نسبة الإرجاع تتجاوز 40% — هذا المنتج قد يضر بسمعة المسوقين
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}