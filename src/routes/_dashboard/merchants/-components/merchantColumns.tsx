// src/routes/_dashboard/merchants/-components/merchantColumns.tsx
import type { Merchant } from '../-merchants.types'
import type { ColumnDef } from '../../-shared/-components/UserTable'
import { fmt, statusLabel, statusColor } from '../-utils/format'

export const merchantColumns: ColumnDef<Merchant>[] = [
  {
    key: 'merchant',
    header: 'التاجر',
    render: (m) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm shrink-0">
          {m.name[0]}
        </div>
        <div>
          <p className="font-semibold text-slate-800 leading-tight">{m.businessName}</p>
          <p className="text-xs text-slate-400">{m.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'wilaya',
    header: 'الولاية',
    render: (m) => (
      <span className="text-slate-500 text-xs whitespace-nowrap">{m.wilaya}</span>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (m) => (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(m.status)}`}>
        {statusLabel(m.status)}
      </span>
    ),
  },
  {
    key: 'products',
    header: 'المنتجات',
    render: (m) => <span className="text-slate-600 font-medium">{m.totalProducts}</span>,
  },
  {
    key: 'orders',
    header: 'الطلبات',
    render: (m) => <span className="text-slate-600 font-medium">{fmt(m.totalOrders)}</span>,
  },
  {
    key: 'revenue',
    header: 'الإيرادات',
    render: (m) => (
      <span className="whitespace-nowrap">
        <span className="font-semibold text-slate-700">{fmt(m.totalRevenue)}</span>
        <span className="text-xs text-slate-400 font-normal mr-1">DZD</span>
      </span>
    ),
  },
  {
    key: 'warnings',
    header: 'الإنذارات',
    render: (m) =>
      m.warnings.length > 0 ? (
        <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          {m.warnings.length}
        </span>
      ) : (
        <span className="text-slate-300 text-xs">—</span>
      ),
  },
]