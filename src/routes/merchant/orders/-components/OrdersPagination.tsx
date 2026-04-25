// merchant/orders/-components/OrdersPagination.tsx

import { ChevronRight, ChevronLeft } from 'lucide-react'

interface OrdersPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function OrdersPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: OrdersPaginationProps) {
  const from = (currentPage - 1) * pageSize + 1
  const to   = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
      {/* معلومات */}
      <span className="text-xs text-gray-400">
        عرض {from}–{to} من أصل {totalItems} طلبية
      </span>

      {/* أزرار التنقل */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={13} />
          السابق
        </button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) =>
              p === 1 ||
              p === totalPages ||
              Math.abs(p - currentPage) <= 1
            )
            .reduce<(number | '...')[]>((acc, page, idx, arr) => {
              if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
                acc.push('...')
              }
              acc.push(page)
              return acc
            }, [])
            .map((page, idx) =>
              page === '...' ? (
                <span key={`dots-${idx}`} className="px-1 text-xs text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[28px] rounded-lg px-2 py-1.5 text-xs transition-colors ${
                    page === currentPage
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          التالي
          <ChevronLeft size={13} />
        </button>
      </div>
    </div>
  )
}