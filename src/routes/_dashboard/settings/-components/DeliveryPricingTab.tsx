import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Save, RotateCcw } from 'lucide-react'
import {
  getDeliveryPricing,
  syncDeliveryPricing,
  updateDeliveryPrice,
  resetDeliveryPrice
  
} from '../../integration/-server/pricing.api'
import type {PricingRow} from '../../integration/-server/pricing.api';

type Edit = { home: number; office: number }

export function DeliveryPricingTab() {
  const [rows, setRows] = useState<PricingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [busyWilaya, setBusyWilaya] = useState<number | null>(null)
  const [edit, setEdit] = useState<Record<number, Edit>>({})
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await getDeliveryPricing())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الأسعار')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSync(force: boolean) {
    setSyncing(true)
    setError('')
    try {
      await syncDeliveryPricing({ data: { force } })
      setEdit({})
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل المزامنة من ECOTRACK')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSave(w: PricingRow) {
    const e = edit[w.wilayaId] ?? { home: w.homePrice, office: w.officePrice }
    setBusyWilaya(w.wilayaId)
    setError('')
    try {
      await updateDeliveryPrice({
        data: { wilayaId: w.wilayaId, homePrice: e.home, officePrice: e.office },
      })
      setEdit((prev) => {
        const next = { ...prev }
        delete next[w.wilayaId]
        return next
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ السعر')
    } finally {
      setBusyWilaya(null)
    }
  }

  async function handleReset(w: PricingRow) {
    setBusyWilaya(w.wilayaId)
    setError('')
    try {
      await resetDeliveryPrice({ data: { wilayaId: w.wilayaId } })
      setEdit((prev) => {
        const next = { ...prev }
        delete next[w.wilayaId]
        return next
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل استعادة تعرفة ECOTRACK')
    } finally {
      setBusyWilaya(null)
    }
  }

  const cur = (w: PricingRow): Edit => edit[w.wilayaId] ?? { home: w.homePrice, office: w.officePrice }
  const dirty = (w: PricingRow): boolean => {
    const e = edit[w.wilayaId]
    return !!e && (e.home !== w.homePrice || e.office !== w.officePrice)
  }
  const patch = (id: number, p: Partial<Edit>) =>
    setEdit((prev) => {
      const base = prev[id] ?? rows.find((r) => r.wilayaId === id)!
      return { ...prev, [id]: { home: base.home, office: base.office, ...p } as Edit }
    })

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">أسعار التوصيل لكل ولاية</h2>
          <p className="text-sm text-gray-500">
            تُزامَن من ECOTRACK وتُعرَض للمسوّق عند إنشاء الطلبية. يمكنك تعديل أيّ سعر يدويّاً.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSync(false)}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            مزامنة من ECOTRACK
          </button>
          <button
            onClick={() => {
              if (window.confirm('فرض المزامنة سيكتب فوق كل الأسعار المعدّلة يدويّاً. متابعة؟')) {
                void handleSync(true)
              }
            }}
            disabled={syncing}
            className="rounded-lg border border-amber-200 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            فرض إعادة الضبط للكل
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> جارٍ التحميل...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            لا توجد أسعار بعد — اضغط «مزامنة من ECOTRACK» للبدء
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-right text-xs font-medium text-gray-500">
                <th className="px-4 py-3">الولاية</th>
                <th className="px-4 py-3">سعر المنزل (د.ج)</th>
                <th className="px-4 py-3">سعر المكتب (د.ج)</th>
                <th className="px-4 py-3">آخر مزامنة</th>
                <th className="px-4 py-3">المصدر</th>
                <th className="px-4 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const busy = busyWilaya === w.wilayaId
                const c = cur(w)
                return (
                  <tr key={w.wilayaId} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-800">
                      <span className="text-gray-400">{w.wilayaId}</span> — {w.wilayaName}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={c.home}
                        onChange={(e) => patch(w.wilayaId, { home: Number(e.target.value) })}
                        className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={c.office}
                        onChange={(e) => patch(w.wilayaId, { office: Number(e.target.value) })}
                        className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(w.lastSyncedAt).toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="px-4 py-3">
                      {w.adminOverride ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          معدّل يدويّاً
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          ECOTRACK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSave(w)}
                          disabled={busy || !dirty(w)}
                          title="حفظ (يضبط تعديلاً يدويّاً)"
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          حفظ
                        </button>
                        {w.adminOverride && (
                          <button
                            onClick={() => handleReset(w)}
                            disabled={busy}
                            title="استعادة تعرفة ECOTRACK"
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                          >
                            <RotateCcw size={12} /> استعادة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
