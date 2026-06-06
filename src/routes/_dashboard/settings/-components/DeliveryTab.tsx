import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Plug, Loader2, Star, Power } from 'lucide-react'
import {
  getDeliveryAccounts,
  createDeliveryAccount,
  updateDeliveryAccount,
  toggleDeliveryAccountStatus,
  deleteDeliveryAccount,
  testDeliveryAccountConnection
  
} from '../../integration/-server/delivery.api'
import type {DeliveryAccountView} from '../../integration/-server/delivery.api';

interface FormState {
  name: string
  provider: string
  baseUrl: string
  apiKey: string
  isDefault: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  provider: 'ecotrack',
  baseUrl: 'https://platform.dhd-dz.com',
  apiKey: '',
  isDefault: false,
}

export function DeliveryTab() {
  const [accounts, setAccounts] = useState<DeliveryAccountView[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await getDeliveryAccounts())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الحسابات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate() {
    if (!form.name.trim() || form.apiKey.trim().length < 10) {
      setError('الاسم ومفتاح API (10 أحرف على الأقل) مطلوبان')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createDeliveryAccount({
        data: {
          name: form.name,
          provider: form.provider,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl.trim() || undefined,
          isDefault: form.isDefault,
        },
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الحساب')
    } finally {
      setSaving(false)
    }
  }

  async function runAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id)
    try {
      await action()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تنفيذ العملية')
    } finally {
      setBusyId(null)
    }
  }

  async function handleTest(id: string) {
    setBusyId(id)
    try {
      const res = await testDeliveryAccountConnection({ data: { id } })
      setTestResult((prev) => ({ ...prev, [id]: { ok: res.success, msg: res.message } }))
    } catch (err) {
      setTestResult((prev) => ({
        ...prev,
        [id]: { ok: false, msg: err instanceof Error ? err.message : 'فشل الاختبار' },
      }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">شركات التوصيل</h2>
          <p className="text-sm text-gray-500">إدارة حسابات ECOTRACK المرتبطة بالمنصّة</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Plus size={15} /> إضافة حساب
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">الاسم</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: DHD Principal"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">المزوّد</label>
              <select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
              >
                <option value="ecotrack">ecotrack</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                نطاق الـ API (Base URL)
              </label>
              <input
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                placeholder="https://platform.dhd-dz.com"
                dir="ltr"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                نطاق الناقل على منصّة ECOTRACK (white-label). اتركه فارغاً لاستخدام الافتراضي.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">مفتاح API</label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="API Token من لوحة ECOTRACK"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              تعيينه كحساب افتراضي
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
                setError('')
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> جارٍ التحميل...
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            لا توجد حسابات توصيل — أضِف حساب ECOTRACK للبدء
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-right text-xs font-medium text-gray-500">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">المزوّد</th>
                <th className="px-4 py-3">المفتاح</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">افتراضي</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const busy = busyId === a.id
                const test = testResult[a.id]
                return (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.provider}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{a.apiKeyMasked}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {a.isActive ? 'مفعّل' : 'معطّل'}
                      </span>
                      {test && (
                        <span
                          className={`mr-2 text-xs ${test.ok ? 'text-green-600' : 'text-red-500'}`}
                        >
                          {test.ok ? '✓' : '✕'} {test.msg}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.isDefault ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Star size={12} className="fill-amber-400 text-amber-400" /> افتراضي
                        </span>
                      ) : (
                        <button
                          onClick={() => runAction(a.id, () => updateDeliveryAccount({ data: { id: a.id, isDefault: true } }))}
                          disabled={busy}
                          className="text-xs text-gray-400 hover:text-amber-600 disabled:opacity-50"
                        >
                          تعيين
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTest(a.id)}
                          disabled={busy}
                          title="اختبار الاتصال"
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                        </button>
                        <button
                          onClick={() => runAction(a.id, () => toggleDeliveryAccountStatus({ data: { id: a.id } }))}
                          disabled={busy}
                          title={a.isActive ? 'تعطيل' : 'تفعيل'}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('حذف هذا الحساب؟')) {
                              void runAction(a.id, () => deleteDeliveryAccount({ data: { id: a.id } }))
                            }
                          }}
                          disabled={busy}
                          title="حذف"
                          className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
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
