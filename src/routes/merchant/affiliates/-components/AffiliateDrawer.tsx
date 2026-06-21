// src/routes/merchant/affiliates/-components/AffiliateDrawer.tsx

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Affiliate } from '../-affiliates.types'

const TIER_LABELS = { gold: 'ذهبي', silver: 'فضي', bronze: 'برونزي' }
const TIER_THRESHOLDS = { gold: 100, silver: 50, bronze: 0 }

function formatDZD(amount: number): string {
  return `${amount.toLocaleString('en-US')} DZD`
}

interface Props {
  affiliate: Affiliate | null
  onClose: () => void
  onBlock: (id: string) => void
  onUnblock: (id: string) => void
}

export function AffiliateDrawer({ affiliate, onClose, onBlock, onUnblock }: Props) {
  const [confirmBlock, setConfirmBlock] = useState(false)

  if (!affiliate) return null

  const isHighReturn = affiliate.returnRate > 20
  const nextTierLabel =
    affiliate.tier === 'bronze'
      ? `${TIER_THRESHOLDS.silver - affiliate.deliveredOrders} طلبية للفضي`
      : affiliate.tier === 'silver'
        ? `${TIER_THRESHOLDS.gold - affiliate.deliveredOrders} طلبية للذهبي`
        : 'أعلى مستوى'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[90vw] flex-col gap-4 overflow-y-auto bg-white p-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">تفاصيل المسوق</h2>
          <button
            onClick={onClose}
            className="text-lg leading-none text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-gray-700"
            style={{ backgroundColor: affiliate.avatarColor }}
          >
            {affiliate.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{affiliate.name}</p>
            <p className="text-xs text-gray-400">
              انضم{' '}
              {new Date(affiliate.joinedAt).toLocaleDateString('ar-DZ', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <span className="mt-1 inline-block rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {TIER_LABELS[affiliate.tier]} — {affiliate.deliveredOrders} طلبية
            </span>
          </div>
        </div>

        {/* Progress to next tier */}
        {affiliate.tier !== 'gold' && (
          <p className="text-xs text-gray-400">{nextTierLabel} للترقية</p>
        )}

        {/* 30-day chart */}
        {affiliate.last30DaysSales.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-gray-400">مبيعاته لمنتجاتك — آخر 30 يوماً</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={affiliate.last30DaysSales} barSize={8}>
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                  formatter={(v) => [`${v ?? 0} طلبيات`, '']}
                  labelFormatter={(l) => `اليوم ${l}`}
                />
                <Bar dataKey="orders" fill="#111827" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* Top products */}
        <div>
          <p className="mb-2 text-xs text-gray-400">أفضل 3 منتجات ينجح بها</p>
          <div className="flex flex-col gap-2">
            {affiliate.topProducts.map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-900">{p.productName}</p>
                  <p className="text-xs text-gray-400">{p.unitsSold} وحدة مُسلمة</p>
                </div>
                <p className="shrink-0 text-xs font-medium text-green-600">
                  {formatDZD(p.commission)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-400">معدل الروتور</p>
            <p
              className={`mt-1 text-sm font-medium ${isHighReturn ? 'text-red-600' : 'text-green-600'}`}
            >
              {affiliate.returnRate}%{isHighReturn && ' — مرتفع'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-400">العمولات الكلية</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDZD(affiliate.totalCommissions)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-400">الهاتف</p>
            <p className="mt-1 text-sm font-medium text-gray-900" dir="ltr">
              {affiliate.phone}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-400">الولاية</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{affiliate.wilaya}</p>
          </div>
        </div>

        {/* Block / Unblock */}
        <div className="mt-auto pt-2">
          {affiliate.status === 'active' ? (
            confirmBlock ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="mb-2 text-xs text-red-700">
                  هل أنت متأكد من حظر هذا المسوق من الترويج لمنتجاتك؟
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onBlock(affiliate.id)
                      setConfirmBlock(false)
                    }}
                    className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    تأكيد الحظر
                  </button>
                  <button
                    onClick={() => setConfirmBlock(false)}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmBlock(true)}
                className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                حظر هذا المسوق من منتجاتك
              </button>
            )
          ) : (
            <button
              onClick={() => onUnblock(affiliate.id)}
              className="w-full rounded-lg border border-green-200 bg-green-50 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              رفع الحظر عن هذا المسوق
            </button>
          )}
        </div>
      </div>
    </>
  )
}