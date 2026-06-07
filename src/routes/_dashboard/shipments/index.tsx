import { useState, useMemo } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2, Printer } from 'lucide-react'
import { getShipments, printOfficialLabel } from './-server/shipments.api'
import { ShipmentsTable } from './-components/ShipmentsTable'
import { LabelPrintView  } from './-components/LabelPrintView'
import type {PrintedLabel} from './-components/LabelPrintView';

export const Route = createFileRoute('/_dashboard/shipments/')({
  loader: () => getShipments(),
  component: ShipmentsPage,
})

function ShipmentsPage() {
  const shipments = Route.useLoaderData()
  const router = useRouter()
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [labels, setLabels] = useState<PrintedLabel[]>([])

  const visible = useMemo(
    () => (filter === 'pending' ? shipments.filter((s) => !s.labelPrintedAt) : shipments),
    [shipments, filter],
  )
  const pendingCount = useMemo(
    () => shipments.filter((s) => !s.labelPrintedAt).length,
    [shipments],
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

  async function handleBulkPrint() {
    const ids = [...selectedIds]
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
    if (failures.length) alert(`تعذّر طباعة بعض الملصقات:\n${failures.join('\n')}`)
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الشحنات</h1>
          <p className="text-sm text-gray-500">
            طباعة الملصقات الرسمية من شركة التوصيل وإدارة الشحنات
          </p>
        </div>
        <button
          onClick={handleBulkPrint}
          disabled={bulkBusy || selectedIds.size === 0}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
        >
          {bulkBusy ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          طباعة المحدد ({selectedIds.size})
        </button>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['pending', `بانتظار الطباعة (${pendingCount})`],
            ['all', 'الكل'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ShipmentsTable
        shipments={visible}
        selectedIds={selectedIds}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onPrint={handlePrint}
        busyId={busyId}
      />

      <LabelPrintView labels={labels} onClose={() => setLabels([])} />
    </div>
  )
}
