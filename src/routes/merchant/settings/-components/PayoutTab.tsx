import { useState } from 'react'
import type { PayoutData, PayoutAccount, PayoutMethod } from '../settings.types'
import { updatePayout } from '../-server/settings.api'

interface Props {
  data: PayoutData
}

const PAYOUT_ICONS: Record<PayoutMethod, string> = {
  ccp: '📮',
  cib: '🏦',
  paysera: '💳',
}

const PAYOUT_LABELS: Record<PayoutMethod, string> = {
  ccp: 'حساب CCP',
  cib: 'تحويل بنكي (CIB/RIB)',
  paysera: 'Paysera',
}

const FREQUENCY_LABELS: Record<string, string> = {
  manual: 'يدوي فقط',
  weekly: 'أسبوعي (كل إثنين)',
  monthly: 'شهري (أول الشهر)',
}

interface AddAccountModalProps {
  onClose: () => void
  onAdd: (account: PayoutAccount) => void
}

function AddAccountModal({ onClose, onAdd }: AddAccountModalProps) {
  const [type, setType] = useState<PayoutMethod>('ccp')
  const [detail, setDetail] = useState('')

  const handleAdd = () => {
    if (!detail.trim()) return
    onAdd({
      id: `acc-${Date.now()}`,
      type,
      label: PAYOUT_LABELS[type],
      detail,
      isDefault: false,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            إضافة حساب جديد
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              نوع الحساب
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PayoutMethod)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-0"
            >
              <option value="ccp">حساب CCP</option>
              <option value="cib">تحويل بنكي (CIB/RIB)</option>
              <option value="paysera">Paysera</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              {type === 'ccp'
                ? 'رقم الحساب البريدي'
                : type === 'cib'
                  ? 'رقم RIB'
                  : 'البريد الإلكتروني'}
            </label>
            <input
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={
                type === 'ccp'
                  ? '2001 0000 00'
                  : type === 'cib'
                    ? '007 00600 ...'
                    : 'email@example.com'
              }
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-0"
              
            />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={handleAdd}
            className="flex-1 rounded-lg bg-gray-900 py-2 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
          >
            إضافة
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PayoutTab({ data }: Props) {
  const [accounts, setAccounts] = useState<PayoutAccount[]>(data.accounts)
  const [threshold, setThreshold] = useState(data.withdrawalSettings.threshold)
  const [frequency, setFrequency] = useState(data.withdrawalSettings.frequency)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setDefault = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => ({ ...acc, isDefault: acc.id === id })),
    )
  }

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id))
  }

  const handleAdd = (account: PayoutAccount) => {
    setAccounts((prev) => [...prev, account])
  }

  const handleSave = async () => {
    setSaving(true)
    await updatePayout({
      data: {
        accounts,
        withdrawalSettings: { threshold, frequency },
      },
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-8">
      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Payout Accounts */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            الحسابات البنكية المرتبطة
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            الحسابات التي سيتم تحويل أرباحك إليها
          </p>
        </div>

        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                account.isDefault
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                  {PAYOUT_ICONS[account.type]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {account.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5" dir="ltr">
                    {account.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {account.isDefault ? (
                  <span className="text-[10px] font-semibold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                    افتراضي
                  </span>
                ) : (
                  <button
                    onClick={() => setDefault(account.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
                  >
                    جعله افتراضي
                  </button>
                )}
                {!account.isDefault && (
                  <button
                    onClick={() => removeAccount(account.id)}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 transition-colors"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          + إضافة حساب جديد
        </button>
      </section>

      {/* Withdrawal Settings */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            إعدادات السحب التلقائي
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تحديد متى وكيف تتم تحويلات الأرباح إلى حسابك
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              حد السحب التلقائي (DZD)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              min={10000}
              step={5000}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-0"
              dir="ltr"
            />
            <span className="text-[10px] text-gray-400">
              سيتم السحب تلقائياً عند تجاوز هذا المبلغ
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              تكرار السحب
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-0"
            >
              {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
        {saved && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            تم الحفظ بنجاح
          </span>
        )}
      </div>
    </div>
  )
}
