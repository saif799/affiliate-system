import { useState } from 'react'
import type {
  NotificationsData,
  NotificationToggles,
} from '../-settings.types'
import { updateNotifications } from '../-server/settings.api'

interface Props {
  data: NotificationsData
}

interface ToggleItem {
  key: keyof NotificationToggles
  label: string
  description: string
  critical?: boolean
}

const TOGGLES: ToggleItem[] = [
  {
    key: 'newOrders',
    label: 'طلبيات جديدة للتغليف',
    description: 'إشعار فوري عند دخول طلبية جديدة تنتظر التجهيز',
  },
  {
    key: 'paymentConfirmation',
    label: 'تأكيد التحويلات المالية',
    description: 'إشعار عند اكتمال تحويل أرباحك إلى حسابك البنكي',
  },
  {
    key: 'weeklyReport',
    label: 'تقارير الأداء الأسبوعية',
    description: 'ملخص مبيعاتك كل إثنين صباحاً',
  },
  {
    key: 'returnRateAlert',
    label: 'تنبيهات معدل الروتور',
    description: 'إنذار فوري عند تجاوز معدل الاسترجاع حد 20%',
    critical: true,
  },
  {
    key: 'affiliateActivity',
    label: 'نشاط المسوقين المرتبطين',
    description: 'إشعار عند انضمام مسوق جديد لمنتجاتك أو تعليق نشاطه',
  },
]

interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
  critical?: boolean
}

function Toggle({ checked, onChange, critical }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
        checked
          ? critical
            ? 'bg-red-500'
            : 'bg-gray-900'
          : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-1' : 'translate-x-5'
        }`}
      />
    </button>
  )
}

export default function NotificationsTab({ data }: Props) {
  const [toggles, setToggles] = useState<NotificationToggles>(data.toggles)
  const [email, setEmail] = useState(data.channels.email)
  const [whatsapp, setWhatsapp] = useState(data.channels.whatsapp)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateToggle = (key: keyof NotificationToggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    await updateNotifications({
      data: {
        toggles,
        channels: { email, whatsapp },
      },
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-8">
      {/* Toggles */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            أنواع الإشعارات
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تحكم في متى يتواصل معك النظام
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {TOGGLES.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center justify-between px-4 py-3.5 ${
                i < TOGGLES.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex-1 ml-4">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-900">
                    {item.label}
                  </p>
                  {item.critical && (
                    <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      حرج
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </p>
              </div>
              <Toggle
                checked={toggles[item.key]}
                onChange={(val) => updateToggle(item.key, val)}
                critical={item.critical}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Channels */}
      <section>
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            قنوات الإشعارات
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تحديد أين تصلك الإشعارات
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">
              رقم واتساب (للإشعارات الفورية)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="0555 000 000"
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400 transition-colors"
              dir="ltr"
            />
            <span className="text-[10px] text-gray-400">
              إضافي — للإشعارات العاجلة كالروتور وطلبيات التغليف
            </span>
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