import { useState } from 'react'
import type { Integration } from '../integration.types'

interface Props {
  integration: Integration
}

const STATUS_CONFIG = {
  connected:    { label: 'متصل',       class: 'bg-green-100 text-green-700'  },
  disconnected: { label: 'غير متصل',   class: 'bg-gray-100 text-gray-500'    },
  error:        { label: 'خطأ في الربط', class: 'bg-red-100 text-red-700'    },
}

export function IntegrationCard({ integration: itg }: Props) {
  const [showModal, setShowModal] = useState(false)
  const status = STATUS_CONFIG[itg.status]

  return (
    <>
      <div className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        itg.status === 'error' ? 'border-red-200' : 'border-gray-100'
      }`}>
        {/* top row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: itg.iconBg }}
            >
              {itg.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{itg.name}</span>
                {itg.comingSoon && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    قريباً
                  </span>
                )}
              </div>
              {itg.lastSync && (
                <span className="text-xs text-gray-400">آخر sync: {itg.lastSync}</span>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}>
            {status.label}
          </span>
        </div>

        {/* description */}
        <p className="mb-4 text-xs leading-relaxed text-gray-500">{itg.description}</p>

        {/* actions */}
        <div className="flex items-center gap-2">
          {itg.comingSoon ? (
            <button type="button" disabled
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed">
              قريباً
            </button>
          ) : itg.status === 'connected' ? (
            <>
              <button type="button"
                onClick={() => setShowModal(true)}
                className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                الإعدادات
              </button>
              <button type="button"
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                فصل
              </button>
            </>
          ) : (
            <button type="button"
              onClick={() => setShowModal(true)}
              className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors">
              {itg.status === 'error' ? 'إعادة الربط' : 'ربط'}
            </button>
          )}
          {itg.docsUrl && (
            <a href={itg.docsUrl} target="_blank" rel="noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              Docs
            </a>
          )}
        </div>

        {/* error hint */}
        {itg.status === 'error' && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            ⚠️ فشل آخر اتصال — تحقق من الـ API Key أو تواصل مع الدعم
          </div>
        )}
      </div>

      {/* setup modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-96 rounded-xl bg-white p-6 shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: itg.iconBg }}
              >
                {itg.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ربط {itg.name}</h3>
                <p className="text-xs text-gray-400">أدخل بيانات الاعتماد للربط</p>
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">API Key</label>
              <input
                type="text"
                placeholder="أدخل الـ API Key الخاص بك..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                dir="ltr"
              />
            </div>

            {(itg.id === 'youcan' || itg.id === 'shopify' || itg.id === 'woocommerce') && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">Store URL</label>
                <input
                  type="text"
                  placeholder="https://mystore.youcan.shop"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  dir="ltr"
                />
              </div>
            )}

            {itg.id === 'webhook' && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://your-app.com/webhook"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  dir="ltr"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm hover:bg-gray-50">
                إلغاء
              </button>
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                حفظ وربط
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}