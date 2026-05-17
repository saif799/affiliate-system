// src/routes/_dashboard/merchants/-components/MerchantRowActions.tsx
import type { Merchant, MerchantStatus } from '../-merchants.types'

interface Props {
  merchant:       Merchant
  loading:        boolean
  onView:         () => void
  onWarn:         () => void
  onStatusChange: (status: MerchantStatus) => void
  onDelete:       () => void
}

export function MerchantRowActions({
  merchant,
  loading,
  onView,
  onWarn,
  onStatusChange,
  onDelete,
}: Props) {
  return (
    <>
      <button
        onClick={onView}
        disabled={loading}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
      >
        عرض
      </button>

      <button
        onClick={onWarn}
        disabled={loading}
        className="text-xs font-semibold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
      >
        إنذار
      </button>

      {merchant.status !== 'suspended' ? (
        <button
          onClick={() => onStatusChange('suspended')}
          disabled={loading}
          className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {loading ? '...' : 'تعليق'}
        </button>
      ) : (
        <button
          onClick={() => onStatusChange('active')}
          disabled={loading}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {loading ? '...' : 'تفعيل'}
        </button>
      )}

      <button
        onClick={onDelete}
        disabled={loading}
        className="text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        title="حذف التاجر"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </>
  )
}