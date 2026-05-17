// src/routes/_dashboard/affiliates/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'

import { MOCK_AFFILIATES, MOCK_AFFILIATE_JOIN_REQUESTS } from './-server/affiliates.mock'
import type { Affiliate, AffiliateStatus } from './-affiliates.types'

import { UserStatCard }        from '../-shared/-components/UserStatCard'
import { UserFilters }         from '../-shared/-components/UserFilters'
import { UserTable }           from '../-shared/-components/UserTable'
import type { ColumnDef }      from '../-shared/-components/UserTable'
import { JoinRequestsSection } from '../-shared/-components/JoinRequestsSection'
import type { JoinRequest }    from '../-shared/-shared.types'
import { AffiliateDrawer }     from './-components/AffiliateDrawer'
import { AffiliateWarnModal }  from './-components/AffiliateWarnModal'

export const Route = createFileRoute('/_dashboard/affiliates/')({
  component: AffiliatesPage,
})

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

// ── تعريف الأعمدة ──────────────────────────────────────────────
const affiliateColumns: ColumnDef<Affiliate>[] = [
  {
    key: 'affiliate',
    header: 'المسوق',
    render: (a) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-600 text-sm shrink-0">
          {a.name[0]}
        </div>
        <div>
          <p className="font-semibold text-slate-800 leading-tight">{a.name}</p>
          <p className="text-xs text-slate-400">{a.email}</p>
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

// ── الصفحة ─────────────────────────────────────────────────────
function AffiliatesPage() {
  const [affiliates,    setAffiliates]    = useState<Affiliate[]>(MOCK_AFFILIATES)
  const [joinRequests,  setJoinRequests]  = useState<JoinRequest[]>(MOCK_AFFILIATE_JOIN_REQUESTS)
  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState<AffiliateStatus | 'all'>('all')
  const [selected,      setSelected]      = useState<Affiliate | null>(null)
  const [warnFor,       setWarnFor]       = useState<Affiliate | null>(null)
  const [toast,         setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const stats = useMemo(() => ({
    total:     affiliates.length,
    active:    affiliates.filter((a) => a.status === 'active').length,
    suspended: affiliates.filter((a) => a.status === 'suspended').length,
    pending:   affiliates.filter((a) => a.status === 'pending').length,
  }), [affiliates])

  const filtered = useMemo(() =>
    affiliates.filter((a) => {
      const matchSearch =
        a.name.includes(search) ||
        a.email.includes(search)
      const matchFilter = filter === 'all' || a.status === filter
      return matchSearch && matchFilter
    }),
  [affiliates, search, filter])

  function handleStatusChange(id: string, status: AffiliateStatus) {
    setAffiliates((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
  }

  function handleWarnSend(affiliate: Affiliate, message: string) {
    const warning = {
      id: crypto.randomUUID(),
      message,
      sentAt: new Date().toISOString().split('T')[0],
    }
    setAffiliates((prev) =>
      prev.map((a) => a.id === affiliate.id ? { ...a, warnings: [...a.warnings, warning] } : a)
    )
    setSelected((prev) =>
      prev?.id === affiliate.id ? { ...prev, warnings: [...prev.warnings, warning] } : prev
    )
  }

  function handleAcceptRequest(id: string) {
    const req = joinRequests.find((r) => r.id === id)
    if (!req) return
    const newAffiliate: Affiliate = {
      id:                 `af${Date.now()}`,
      name:               req.name,
      email:              req.email,
      phone:              req.phone,
      wilaya:             req.wilaya,
      status:             'active',
      joinedAt:           new Date().toISOString().split('T')[0],
      totalCampaigns:     0,
      totalOrders:        0,
      totalCommissions:   0,
      pendingCommissions: 0,
      warnings:           [],
    }
    setAffiliates((prev) => [...prev, newAffiliate])
    setJoinRequests((prev) => prev.filter((r) => r.id !== id))
    showToast(`تم قبول طلب ${req.name} وإضافته كمسوق نشط`, 'success')
  }

  function handleRejectRequest(id: string, _note: string) {
    const req = joinRequests.find((r) => r.id === id)
    setJoinRequests((prev) => prev.filter((r) => r.id !== id))
    showToast(`تم رفض طلب ${req?.name}`, 'error')
  }

  function renderAffiliateActions(a: Affiliate) {
    return (
      <>
        <button
          onClick={() => setSelected(a)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          عرض
        </button>
        <button
          onClick={() => setWarnFor(a)}
          className="text-xs font-semibold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          إنذار
        </button>
        {a.status !== 'suspended' ? (
          <button
            onClick={() => handleStatusChange(a.id, 'suspended')}
            className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            تعليق
          </button>
        ) : (
          <button
            onClick={() => handleStatusChange(a.id, 'active')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            تفعيل
          </button>
        )}
      </>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-6 space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المسوقون</h1>
          <p className="text-sm text-slate-400 mt-0.5">إدارة ومتابعة جميع المسوقين</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm transition-colors shadow-sm shadow-violet-200">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إضافة مسوق
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UserStatCard
          label="إجمالي المسوقين"
          value={stats.total}
          accent="bg-violet-50"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <UserStatCard
          label="المسوقون النشطون"
          value={stats.active}
          sub={`${stats.suspended} موقوف`}
          accent="bg-emerald-50"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
        <UserStatCard
          label="قيد الانتظار"
          value={stats.pending}
          accent="bg-amber-50"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        {/* join requests card */}
        <div
          className="bg-white rounded-2xl border border-violet-200 p-5 shadow-sm flex items-start gap-4 cursor-pointer hover:border-violet-400 transition-colors relative overflow-hidden"
          onClick={() => document.getElementById('requests-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          {joinRequests.length > 0 && (
            <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          )}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium mb-0.5">طلبات الانضمام</p>
            <p className="text-2xl font-bold text-violet-700 leading-none">{joinRequests.length}</p>
            {joinRequests.length > 0 && (
              <p className="text-xs text-violet-400 mt-1">تنتظر المراجعة</p>
            )}
          </div>
        </div>
      </div>

      {/* join requests */}
      {joinRequests.length > 0 && (
        <div id="requests-section">
          <JoinRequestsSection
            requests={joinRequests}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        </div>
      )}

      {/* filters */}
      <UserFilters
        search={search}
        filter={filter}
        onSearch={setSearch}
        onFilter={setFilter}
        placeholder="البحث باسم المسوق أو البريد..."
      />

      {/* table */}
      <UserTable
        data={filtered}
        total={affiliates.length}
        columns={affiliateColumns}
        renderActions={renderAffiliateActions}
        totalLabel="مسوق"
      />

      {/* drawer */}
      {selected && (
        <AffiliateDrawer
          affiliate={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onWarn={(a) => setWarnFor(a)}
        />
      )}

      {/* warn modal */}
      {warnFor && (
        <AffiliateWarnModal
          affiliate={warnFor}
          onClose={() => setWarnFor(null)}
          onSend={(msg) => handleWarnSend(warnFor, msg)}
        />
      )}
    </div>
  )
}