// src/routes/_dashboard/affiliates/-components/affiliateColumns.tsx
import type { ColumnDef } from '../../-shared/-components/UserTable'
import type { Affiliate, AffiliateStatus } from '../-affiliates.types'

function fmt(n: number) {
  return new Intl.NumberFormat('ar-DZ').format(n)
}

function statusLabel(s: AffiliateStatus) {
  return s === 'active' ? 'نشط' : s === 'suspended' ? 'موقوف' : 'قيد الانتظار'
}

function statusColor(s: AffiliateStatus) {
  return s === 'active'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : s === 'suspended'
    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
}

export const affiliateColumns: ColumnDef<Affiliate>[] = [
  {
    key: 'affiliate',
    header: 'المسوق',
    render: (a) => (
      <div className="flex items-center gap-3 min-w-0 max-w-[220px]">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600 text-sm shrink-0">
          {a.name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 leading-tight truncate">{a.name}</p>
          <p className="text-xs text-slate-400 truncate">{a.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'wilaya',
    header: 'الولاية',
    render: (a) => (
      <span className="text-slate-500 text-xs whitespace-nowrap">{a.wilaya}</span>
    ),
  },
  {
    key: 'status',
    header: 'الحالة',
    render: (a) => (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(a.status)}`}>
        {statusLabel(a.status)}
      </span>
    ),
  },
  {
    key: 'campaigns',
    header: 'الحملات',
    render: (a) => <span className="text-slate-600 font-medium">{a.totalCampaigns}</span>,
  },
  {
    key: 'orders',
    header: 'الطلبات',
    render: (a) => <span className="text-slate-600 font-medium">{fmt(a.totalOrders)}</span>,
  },
  {
    key: 'commissions',
    header: 'العمولات',
    render: (a) => (
      <span className="whitespace-nowrap">
        <span className="font-semibold text-slate-700">{fmt(a.totalCommissions)}</span>
        <span className="text-xs text-slate-400 font-normal mr-1">DZD</span>
      </span>
    ),
  },
  {
    key: 'pending',
    header: 'معلقة',
    render: (a) =>
      a.pendingCommissions > 0 ? (
        <span className="font-semibold text-violet-600 text-xs whitespace-nowrap">
          {fmt(a.pendingCommissions)} DZD
        </span>
      ) : (
        <span className="text-slate-300 text-xs">—</span>
      ),
  },
  {
    key: 'warnings',
    header: 'الإنذارات',
    render: (a) =>
      a.warnings.length > 0 ? (
        <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          {a.warnings.length}
        </span>
      ) : (
        <span className="text-slate-300 text-xs">—</span>
      ),
  },
]