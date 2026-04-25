// merchant/orders/-components/BulkActionBar.tsx

import { Printer, RefreshCw, X } from 'lucide-react'

interface BulkActionBarProps {
  count: number
  onPrint: () => void
  onChangeStatus: () => void
  onClear: () => void
}

export function BulkActionBar({
  count,
  onPrint,
  onChangeStatus,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-blue-700">
          {count} طلبية محددة
        </span>
        <div className="h-3.5 w-px bg-blue-200" />
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          <Printer size={13} />
          طباعة البوليصة للكل
        </button>
        <button
          onClick={onChangeStatus}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          <RefreshCw size={13} />
          تغيير الحالة للكل
        </button>
      </div>
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
      >
        <X size={13} />
        إلغاء التحديد
      </button>
    </div>
  )
}