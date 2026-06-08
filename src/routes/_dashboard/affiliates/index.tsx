// src/routes/_dashboard/affiliates/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'

import {
  getAffiliatesData,
  acceptAffiliateRequest,
  rejectAffiliateRequest,
  updateAffiliateStatus,
  sendAffiliateWarning,
  deleteAffiliate,
  inviteAffiliate,
} from './-server/affiliates.api'
import type { InviteAffiliateInput } from './-server/affiliates.api'
import type {
  Affiliate,
  AffiliateStatus,
  JoinRequest,
} from './-affiliates.types'

import { UserStatCard } from '../-shared/-components/UserStatCard'
import { UserFilters } from '../-shared/-components/UserFilters'
import { UserTable } from '../-shared/-components/UserTable'
import { JoinRequestsSection } from '../-shared/-components/JoinRequestsSection'
import { AffiliateDrawer } from './-components/AffiliateDrawer'
import { AffiliateWarnModal } from './-components/AffiliateWarnModal'
import { affiliateColumns } from './-components/affiliateColumns'
import { InviteAffiliateModal } from './-components/InviteAffiliatesModal'
import { PageSpinner, PageError } from '#/routes/-components/shared/RouteStates'

// ملاحظة: أنشئ InviteAffiliateModal مشابهة لـ InviteMerchantModal
// import { InviteAffiliateModal } from './-components/InviteAffiliateModal'

export const Route = createFileRoute('/_dashboard/affiliates/')({
  loader: () => getAffiliatesData(),
  pendingComponent: PageSpinner,
  errorComponent: PageError,
  component: AffiliatesPage,
})

function AffiliatesPage() {
  const loaderData = Route.useLoaderData()

  const [affiliates, setAffiliates] = useState<Affiliate[]>(
    loaderData.affiliates,
  )
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(
    loaderData.joinRequests,
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AffiliateStatus | 'all'>('all')
  const [selected, setSelected] = useState<Affiliate | null>(null)
  const [warnFor, setWarnFor] = useState<Affiliate | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const stats = loaderData.stats

  // ── toast ──────────────────────────────────────────────────
  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── فلترة ──────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      affiliates.filter((a) => {
        const matchSearch = a.name.includes(search) || a.email.includes(search)
        const matchFilter = filter === 'all' || a.status === filter
        return matchSearch && matchFilter
      }),
    [affiliates, search, filter],
  )

  // ── تغيير حالة المسوق ──────────────────────────────────────
  async function handleStatusChange(id: string, status: AffiliateStatus) {
    if (loading) return
    setLoading(id)
    try {
      await updateAffiliateStatus({ data: { affiliateId: id, status } })
      setAffiliates((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      )
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
      showToast(status === 'active' ? 'تم تفعيل المسوق' : 'تم تعليق المسوق')
    } catch {
      showToast('حدث خطأ أثناء تغيير الحالة', 'error')
    } finally {
      setLoading(null)
    }
  }

  // ── إرسال إنذار ────────────────────────────────────────────
  async function handleWarnSend(affiliate: Affiliate, message: string) {
    if (loading) return
    setLoading(affiliate.id)
    try {
      const result = await sendAffiliateWarning({
        data: { affiliateId: affiliate.id, message },
      })
      const warning = {
        id: result.warning.id,
        message,
        sentAt: result.warning.sentAt,
      }
      setAffiliates((prev) =>
        prev.map((a) =>
          a.id === affiliate.id
            ? { ...a, warnings: [...a.warnings, warning] }
            : a,
        ),
      )
      setSelected((prev) =>
        prev?.id === affiliate.id
          ? { ...prev, warnings: [...prev.warnings, warning] }
          : prev,
      )
      showToast('تم إرسال الإنذار بنجاح')
    } catch {
      showToast('حدث خطأ أثناء إرسال الإنذار', 'error')
    } finally {
      setLoading(null)
    }
  }

  // ── حذف مسوق ───────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (loading) return
    setLoading(id)
    try {
      await deleteAffiliate({ data: { affiliateId: id } })
      setAffiliates((prev) => prev.filter((a) => a.id !== id))
      if (selected?.id === id) setSelected(null)
      showToast('تم حذف المسوق بنجاح')
    } catch {
      showToast('حدث خطأ أثناء حذف المسوق', 'error')
    } finally {
      setLoading(null)
    }
  }

  // ── دعوة مسوق جديد ─────────────────────────────────────────
  async function handleInvite(data: InviteAffiliateInput) {
    setInviteLoading(true)
    try {
      const result = await inviteAffiliate({ data })
      const newAffiliate: Affiliate = {
        id: result.userId,
        userId: result.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        wilaya: '—',
        referralCode: result.referralCode,
        refusalRate: 0,
        fraudFlag: false,
        status: 'pending',
        joinedAt: new Date().toISOString().split('T')[0],
        totalCampaigns: 0,
        totalOrders: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        warnings: [],
      }
      setAffiliates((prev) => [newAffiliate, ...prev])
      setShowInvite(false)
      showToast(`تم إرسال دعوة إلى ${data.email} بنجاح`)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الدعوة'
      showToast(msg, 'error')
    } finally {
      setInviteLoading(false)
    }
  }

  // ── قبول طلب انضمام ────────────────────────────────────────
  async function handleAcceptRequest(id: string) {
    const req = joinRequests.find((r) => r.id === id)
    if (!req) return
    setLoading(id)
    try {
      await acceptAffiliateRequest({ data: { userId: id } })
      const newAffiliate: Affiliate = {
        id: id, // سيتحدث عند إعادة التحميل؛ مؤقتاً نستخدم userId
        userId: id,
        name: req.name,
        email: req.email,
        phone: req.phone,
        wilaya: req.wilaya,
        referralCode: '—',
        refusalRate: 0,
        fraudFlag: false,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        totalCampaigns: 0,
        totalOrders: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        warnings: [],
      }
      setAffiliates((prev) => [newAffiliate, ...prev])
      setJoinRequests((prev) => prev.filter((r) => r.id !== id))
      showToast(`تم قبول طلب ${req.name} وإضافته كمسوق نشط`)
    } catch {
      showToast('حدث خطأ أثناء قبول الطلب', 'error')
    } finally {
      setLoading(null)
    }
  }

  // ── رفض طلب انضمام ─────────────────────────────────────────
  async function handleRejectRequest(id: string, _note: string) {
    const req = joinRequests.find((r) => r.id === id)
    setLoading(id)
    try {
      await rejectAffiliateRequest({ data: { userId: id } })
      setJoinRequests((prev) => prev.filter((r) => r.id !== id))
      showToast(`تم رفض طلب ${req?.name}`, 'error')
    } catch {
      showToast('حدث خطأ أثناء رفض الطلب', 'error')
    } finally {
      setLoading(null)
    }
  }

  // ── JSX ────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-6 space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المسوقون</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            إدارة ومتابعة جميع المسوقين
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm transition-colors shadow-sm shadow-violet-200"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إضافة مسوق
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UserStatCard
          label="إجمالي المسوقين"
          value={stats.total.value}
          accent="bg-violet-50"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="1.8"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <UserStatCard
          label="المسوقون النشطون"
          value={stats.active.value}
          sub={`${stats.suspended.value} موقوف`}
          accent="bg-emerald-50"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
        <UserStatCard
          label="قيد الانتظار"
          value={stats.pending.value}
          accent="bg-amber-50"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        {/* join requests card */}
        <div
          className="bg-white rounded-2xl border border-violet-200 p-5 shadow-sm flex items-start gap-4 cursor-pointer hover:border-violet-400 transition-colors relative overflow-hidden"
          onClick={() =>
            document
              .getElementById('requests-section')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          {joinRequests.length > 0 && (
            <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          )}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="1.8"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium mb-0.5">
              طلبات الانضمام
            </p>
            <p className="text-2xl font-bold text-violet-700 leading-none">
              {joinRequests.length}
            </p>
            {joinRequests.length > 0 && (
              <p className="text-xs text-violet-400 mt-1">تنتظر المراجعة</p>
            )}
          </div>
        </div>
      </div>

      {/* join requests section */}
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
        renderActions={(a) => (
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
                disabled={loading === a.id}
                className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                تعليق
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange(a.id, 'active')}
                disabled={loading === a.id}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                تفعيل
              </button>
            )}
          </>
        )}
        totalLabel="مسوق"
      />

      {/* drawer */}
      {selected && (
        <AffiliateDrawer
          affiliate={selected}
          loading={loading === selected.id}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onWarn={(a) => setWarnFor(a)}
          onDelete={handleDelete}
        />
      )}

      {/* warn modal */}
      {warnFor && (
        <AffiliateWarnModal
          affiliate={warnFor}
          loading={loading === warnFor.id}
          onClose={() => setWarnFor(null)}
          onSend={(msg) => handleWarnSend(warnFor, msg)}
        />
      )}

      {/* invite modal — أنشئها مشابهة لـ InviteMerchantModal */}
      {showInvite && (
        <InviteAffiliateModal
          loading={inviteLoading}
          onClose={() => !inviteLoading && setShowInvite(false)}
          onSubmit={handleInvite}
        />
      )}
    </div>
  )
}
