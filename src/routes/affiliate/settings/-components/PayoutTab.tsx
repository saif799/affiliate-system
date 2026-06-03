// ============================================================
// -components/PayoutTab.tsx
// ============================================================

import { useState } from 'react'
import { Plus, Trash2, Star, AlertTriangle, CreditCard, Smartphone, Building2 } from 'lucide-react'
import { addPayoutMethod, deletePayoutMethod, setDefaultPayoutMethod } from '../-server/settings.api'
import type { PayoutMethod, AddPayoutMethodForm, PayoutMethodType } from '../-settings.types'

interface Props {
  methods: PayoutMethod[]
}

const METHOD_ICONS: Record<PayoutMethodType, React.ReactNode> = {
  ccp: <CreditCard size={14} />,
  baridimob: <Smartphone size={14} />,
  bank: <Building2 size={14} />,
}

const METHOD_LABELS: Record<PayoutMethodType, string> = {
  ccp: 'CCP — بريد الجزائر',
  baridimob: 'BaridiMob — RIP',
  bank: 'حساب بنكي',
}

function getAccountSummary(method: PayoutMethod): string {
  const { account } = method
  if (account.type === 'ccp') return `${account.accountNumber} / مفتاح: ${account.key}`
  if (account.type === 'baridimob') return `RIP: ${account.rip.slice(0, 8)}...`
  return `${account.bankName} — ${account.accountNumber}`
}

function AddMethodForm({
  onAdd,
  onCancel,
}: {
  onAdd: (method: PayoutMethod) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<PayoutMethodType>('ccp')
  const [label, setLabel] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    const formData: AddPayoutMethodForm = {
      label: label || METHOD_LABELS[type],
      type,
      ccpAccount: fields.ccpAccount,
      ccpKey: fields.ccpKey,
      rip: fields.rip,
      bankName: fields.bankName,
      bankAccount: fields.bankAccount,
      rib: fields.rib,
    }
    const result = await addPayoutMethod({ data: formData })
    onAdd(result)
    setIsSubmitting(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <p className="text-xs font-medium text-gray-700">إضافة حساب جديد</p>

      {/* نوع الحساب */}
      <div>
        <label className="mb-1.5 block text-xs text-gray-500">نوع الحساب</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(METHOD_LABELS) as PayoutMethodType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs transition-colors ${
                type === t
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {METHOD_ICONS[t]}
              {t === 'ccp' ? 'CCP' : t === 'baridimob' ? 'BaridiMob' : 'بنكي'}
            </button>
          ))}
        </div>
      </div>

      {/* تسمية مخصصة */}
      <div>
        <label className="mb-1 block text-xs text-gray-500">تسمية الحساب (اختياري)</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`مثال: ${METHOD_LABELS[type]}`}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
        />
      </div>

      {/* حقول CCP */}
      {type === 'ccp' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">رقم الحساب</label>
            <input
              value={fields.ccpAccount || ''}
              onChange={(e) => setField('ccpAccount', e.target.value)}
              placeholder="0799 123 456"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">المفتاح (Clé)</label>
            <input
              value={fields.ccpKey || ''}
              onChange={(e) => setField('ccpKey', e.target.value)}
              placeholder="47"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>
        </div>
      )}

      {/* حقول BaridiMob */}
      {type === 'baridimob' && (
        <div>
          <label className="mb-1 block text-xs text-gray-500">رقم RIP (20 رقماً)</label>
          <input
            value={fields.rip || ''}
            onChange={(e) => setField('rip', e.target.value)}
            placeholder="00799999000107991234560047"
            maxLength={20}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-gray-400"
          />
          {fields.rip && fields.rip.length !== 20 && (
            <p className="mt-1 text-xs text-amber-600">
              الرقم يجب أن يكون 20 خانة ({fields.rip.length}/20)
            </p>
          )}
        </div>
      )}

      {/* حقول البنك */}
      {type === 'bank' && (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">اسم البنك</label>
            <input
              value={fields.bankName || ''}
              onChange={(e) => setField('bankName', e.target.value)}
              placeholder="BNA، CPA، BDL..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">رقم الحساب</label>
              <input
                value={fields.bankAccount || ''}
                onChange={(e) => setField('bankAccount', e.target.value)}
                placeholder="0021 0017 ..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">رقم RIB</label>
              <input
                value={fields.rib || ''}
                onChange={(e) => setField('rib', e.target.value)}
                placeholder="RIB"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-60"
        >
          {isSubmitting ? 'جارٍ الإضافة...' : 'إضافة الحساب'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
        >
          إلغاء
        </button>
      </div>
    </div>
  )
}

export function PayoutTab({ methods: initialMethods }: Props) {
  const [methods, setMethods] = useState<PayoutMethod[]>(initialMethods)
  const [showForm, setShowForm] = useState(false)

  const hasDefault = methods.some((m) => m.isDefault)

  async function handleSetDefault(id: string) {
    await setDefaultPayoutMethod({ data: { id } })
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id })),
    )
  }

  async function handleDelete(id: string) {
    await deletePayoutMethod({ data: { id } })
    setMethods((prev) => prev.filter((m) => m.id !== id))
  }

  function handleAdd(newMethod: PayoutMethod) {
    setMethods((prev) => [...prev, newMethod])
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* تحذير إذا لا يوجد حساب */}
      {methods.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-medium text-amber-800">لم تضف حساباً مالياً بعد</p>
            <p className="mt-0.5 text-xs text-amber-600">
              يجب إضافة حساب واحد على الأقل لتتمكن من طلب سحب أموالك من المحفظة.
            </p>
          </div>
        </div>
      )}

      {/* تحذير إذا لا يوجد حساب افتراضي */}
      {methods.length > 0 && !hasDefault && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">
            لم تحدد حساباً افتراضياً — حدد حساباً لتُرسل إليه الأموال تلقائياً عند السحب.
          </p>
        </div>
      )}

      {/* قائمة الحسابات */}
      {methods.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {methods.map((method, i) => (
            <div
              key={method.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < methods.length - 1 ? 'border-b border-gray-50' : ''
              } ${method.isDefault ? 'bg-emerald-50/40' : ''}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                {METHOD_ICONS[method.account.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-900">{method.label}</p>
                  {method.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      افتراضي
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400 truncate">
                  {getAccountSummary(method)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    title="تعيين كافتراضي"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-amber-500"
                  >
                    <Star size={13} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  disabled={method.isDefault}
                  title={method.isDefault ? 'لا يمكن حذف الحساب الافتراضي' : 'حذف'}
                  className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* فورم الإضافة */}
      {showForm ? (
        <AddMethodForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 w-full"
        >
          <Plus size={14} />
          إضافة حساب مالي جديد
        </button>
      )}
    </div>
  )
}