// src/routes/_dashboard/-shared/-components/UserTable.tsx

export interface ColumnDef<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
}

interface Props<T> {
  data: T[]
  total: number
  columns: ColumnDef<T>[]
  renderActions: (row: T) => React.ReactNode
  emptyLabel?: string
  totalLabel?: string
}

export function UserTable<T extends { id: string }>({
  data,
  total,
  columns,
  renderActions,
  emptyLabel = 'لا توجد نتائج مطابقة',
  totalLabel = '',
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
            <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              إجراءات
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-16 text-slate-400 text-sm">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4">
                    {col.render(row)}
                  </td>
                ))}
                <td className="px-4 py-4">
                  {/* الإجراءات ظاهرة دائماً — أوضح للمستخدم من إخفائها خلف hover */}
                  <div className="flex items-center gap-1.5">
                    {renderActions(row)}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400">
          عرض <span className="font-semibold text-slate-600">{data.length}</span> من {total} {totalLabel}
        </p>
      </div>
    </div>
  )
}