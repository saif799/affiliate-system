import { useState, useMemo } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2, Printer, Trash2, X } from 'lucide-react'
import {
  getShipments,
  printOfficialLabel,
  deleteShipmentOrder,
} from './-server/shipments.api'
import { ShipmentsTable } from './-components/ShipmentsTable'
import { LabelPrintView } from './-components/LabelPrintView'
import { ScanVerifyPanel } from './-components/ScanVerifyPanel'
import type { PrintedLabel } from './-components/LabelPrintView'
import { PageSpinner, PageError } from '#/routes/-components/shared/RouteStates'

export const Route = createFileRoute('/_dashboard/shipments/')({
  loader: () => getShipments(),
  pendingComponent: PageSpinner,
  errorComponent: PageError,
  component: ShipmentsPage,
})

function ShipmentsPage() {
  const shipments = Route.useLoaderData()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [labels, setLabels] = useState<PrintedLabel[]>([])

  const visible = useMemo(
    () =>
      filter === 'pending'
        ? shipments.filter((s) => !s.labelPrintedAt)
        : shipments,
    [shipments, filter],
  )
  const pendingCount = useMemo(
    () => shipments.filter((s) => !s.labelPrintedAt).length,
    [shipments],
  )
  // عدد المحدّدين المؤهّلين لكل عملية
  const selectedPrintable = useMemo(
    () => visible.filter((s) => selectedIds.has(s.id) && !s.labelPrintedAt).length,
    [visible, selectedIds],
  )
  const selectedDeletable = useMemo(
    () => visible.filter((s) => selectedIds.has(s.id) && s.status === 'shipped').length,
    [visible, selectedIds],
  )

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAll = (ids: string[]) => setSelectedIds(new Set(ids))

  async function handlePrint(id: string) {
    setBusyId(id)
    try {
      const res = await printOfficialLabel({ data: { orderId: id } })
      setLabels([res])
      await router.invalidate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'فشل طباعة الملصق')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        'حذف هذه الشحنة من شركة التوصيل؟ لا يتمّ إلا إن لم تلتقطها بعد، وسيُعاد المخزون.',
      )
    )
      return
    setDeletingId(id)
    try {
      await deleteShipmentOrder({ data: { orderId: id } })
      await router.invalidate()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'تعذّر حذف الشحنة')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkPrint() {
    // اطبع فقط المحدّدين غير المطبوعين
    const ids = visible
      .filter((s) => selectedIds.has(s.id) && !s.labelPrintedAt)
      .map((s) => s.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    const ok: PrintedLabel[] = []
    const failures: string[] = []
    for (const id of ids) {
      try {
        ok.push(await printOfficialLabel({ data: { orderId: id } }))
      } catch (e) {
        failures.push(`${id}: ${e instanceof Error ? e.message : 'فشل'}`)
      }
    }
    setSelectedIds(new Set())
    setBulkBusy(false)
    if (ok.length) setLabels(ok)
    await router.invalidate()
    if (failures.length)
      alert(`تعذّر طباعة بعض الملصقات:\n${failures.join('\n')}`)
  }

  async function handleBulkDelete() {
    // احذف فقط المحدّدين «المشحونين» (قبل الالتقاط) — الخادم يفرض القاعدة
    const ids = visible
      .filter((s) => selectedIds.has(s.id) && s.status === 'shipped')
      .map((s) => s.id)
    if (ids.length === 0) return
    if (
      !window.confirm(
        `سيُحاول حذف ${ids.length} شحنة من شركة التوصيل. تُحذف فقط التي لم تلتقطها بعد، ويُعاد مخزونها.`,
      )
    )
      return
    setBulkBusy(true)
    let deleted = 0
    const failures: string[] = []
    for (const id of ids) {
      try {
        await deleteShipmentOrder({ data: { orderId: id } })
        deleted++
      } catch (e) {
        failures.push(`${id}: ${e instanceof Error ? e.message : 'فشل'}`)
      }
    }
    setSelectedIds(new Set())
    setBulkBusy(false)
    await router.invalidate()
    if (failures.length)
      alert(
        `حُذِفت ${deleted} شحنة. تعذّر حذف ${failures.length} (التُقطت غالباً):\n${failures.join('\n')}`,
      )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">الشحنات</h1>
        <p className="text-sm text-gray-500">
          طباعة الملصقات الرسمية من شركة التوصيل وإدارة الشحنات
        </p>
      </div>

      <ScanVerifyPanel />

      {/* شريط الفلاتر + شريط الإجراءات الجماعية */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(
            [
              ['all', `الكل (${shipments.length})`],
              ['pending', `بانتظار الطباعة (${pendingCount})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                filter === id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">
              محدّد: {selectedIds.size}
            </span>
            <button
              onClick={handleBulkPrint}
              disabled={bulkBusy || selectedPrintable === 0}
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-40"
            >
              {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              طباعة ({selectedPrintable})
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy || selectedDeletable === 0}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
            >
              {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              حذف ({selectedDeletable})
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-gray-500 hover:bg-gray-100"
            >
              <X size={14} /> إلغاء
            </button>
          </div>
        )}
      </div>

      <ShipmentsTable
        shipments={visible}
        selectedIds={selectedIds}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onPrint={handlePrint}
        onDelete={handleDelete}
        busyId={busyId}
        deletingId={deletingId}
      />

      <LabelPrintView labels={labels} onClose={() => setLabels([])} />
    </div>
  )
}
