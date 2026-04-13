import { createFileRoute } from '@tanstack/react-router'
import { IntegrationCard } from './-components/IntegrationCard'
import { ApiLogsPanel }    from './-components/ApiLogsPanel'
import type { IntegrationGroup } from './integration.types'

export const Route = createFileRoute('/_dashboard/integration/')({
  component: IntegrationHubPage,
})

// ─── البيانات ثابتة — لا تحتاج server fn ────────────

const INTEGRATION_GROUPS: IntegrationGroup[] = [
  {
    category:    'ecommerce',
    label:       'منصات التجارة الإلكترونية',
    description: 'استيراد منتجات التجار وتزامن المخزون تلقائياً',
    integrations: [
      {
        id:          'youcan',
        name:        'YouCan',
        description: 'الأكثر انتشاراً في الجزائر — استيراد المنتجات بصورها وأسعارها بضغطة زر',
        icon:        '🛒',
        iconBg:      '#e0f2fe',
        category:    'ecommerce',
        status:      'connected',
        lastSync:    'منذ 3 دقائق',
        docsUrl:     'https://developers.youcan.shop',
      },
      {
        id:          'shopify',
        name:        'Shopify',
        description: 'ربط المنتجات والمخزون في الوقت الفعلي عبر Shopify Admin API',
        icon:        '🟢',
        iconBg:      '#f0fdf4',
        category:    'ecommerce',
        status:      'disconnected',
        docsUrl:     'https://shopify.dev/docs/api',
      },
      {
        id:          'woocommerce',
        name:        'WooCommerce',
        description: 'ربط مع متاجر WordPress عبر WooCommerce REST API',
        icon:        '🔌',
        iconBg:      '#faf5ff',
        category:    'ecommerce',
        status:      'disconnected',
        docsUrl:     'https://woocommerce.github.io/woocommerce-rest-api-docs',
      },
    ],
  },
  {
    category:    'delivery',
    label:       'شركات التوصيل',
    description: 'تتبع الطرود وتحديث حالة الطلبات وحساب العمولة تلقائياً',
    integrations: [
      {
        id:          'yalidine',
        name:        'Yalidine Express',
        description: 'الأوسع تغطيةً في الجزائر — تحديث حالة الطرد فور تسليمه وحساب عمولة المسوق تلقائياً',
        icon:        '🚚',
        iconBg:      '#fff7ed',
        category:    'delivery',
        status:      'connected',
        lastSync:    'منذ 2 دقائق',
        docsUrl:     'https://api.yalidine.app',
      },
      {
        id:          'zr-express',
        name:        'ZR Express',
        description: 'إنشاء بوليصات الشحن وتتبع التوصيل عبر الـ API الرسمي',
        icon:        '📦',
        iconBg:      '#fff1f2',
        category:    'delivery',
        status:      'error',
        lastSync:    'منذ 34 دقيقة',
      },
      {
        id:          'maystro',
        name:        'Maystro Delivery',
        description: 'تتبع الطرود وإشعارات التوصيل لولايات الجنوب والشرق',
        icon:        '🗺️',
        iconBg:      '#f0fdf4',
        category:    'delivery',
        status:      'disconnected',
      },
    ],
  },
  {
    category:    'automation',
    label:       'أدوات الأتمتة والبيانات',
    description: 'ربط المنصة بأدوات خارجية لأتمتة المهام اليدوية',
    integrations: [
      {
        id:          'google-sheets',
        name:        'Google Sheets',
        description: 'إرسال الطلبيات الجديدة تلقائياً لجدول Call Center لتأكيدها هاتفياً — يُغني عن CRM كامل',
        icon:        '📊',
        iconBg:      '#f0fdf4',
        category:    'automation',
        status:      'connected',
        lastSync:    'منذ 1 دقيقة',
        docsUrl:     'https://developers.google.com/sheets/api',
      },
      {
        id:          'webhook',
        name:        'Webhooks',
        description: 'أرسل أحداث المنصة (طلب جديد، تأكيد، توصيل) لأي URL خارجي عند حدوثها',
        icon:        '🔗',
        iconBg:      '#f8fafc',
        category:    'automation',
        status:      'connected',
        lastSync:    'منذ 1 ساعة',
        docsUrl:     'https://docs.yourdomain.com/webhooks',
      },
    ],
  },
  {
    category:    'notifications',
    label:       'قنوات الإشعارات',
    description: 'إشعار المسوقين والـ Admin بكل تغيير مهم عبر القنوات المناسبة',
    integrations: [
      {
        id:          'telegram',
        name:        'Telegram Bot',
        description: 'إشعارات فورية للـ Admin عند كل حدث حرج: طلب سحب كبير، خطأ في Integration، هجوم احتيال',
        icon:        '✈️',
        iconBg:      '#e0f2fe',
        category:    'notifications',
        status:      'connected',
        lastSync:    'منذ 3 ساعات',
      },
      {
        id:          'messenger',
        name:        'Facebook Messenger',
        description: 'إشعار المسوقين بحالة طلبياتهم عبر Messenger — مجاني وأكثر فاعلية من SMS في الجزائر',
        icon:        '💬',
        iconBg:      '#eff6ff',
        category:    'notifications',
        status:      'disconnected',
        docsUrl:     'https://developers.facebook.com/docs/messenger-platform',
      },
      {
        id:          'whatsapp',
        name:        'WhatsApp Business API',
        description: 'إشعارات WhatsApp للمسوقين — يتطلب اشتراكاً مدفوعاً عبر 360dialog أو Meta مباشرة',
        icon:        '📱',
        iconBg:      '#f0fdf4',
        category:    'notifications',
        status:      'disconnected',
        comingSoon:  true,
        docsUrl:     'https://www.360dialog.com',
      },
    ],
  },
]

// ─── page ─────────────────────────────────────────────

function IntegrationHubPage() {
  const connectedCount = INTEGRATION_GROUPS
    .flatMap((g) => g.integrations)
    .filter((i) => i.status === 'connected').length

  const errorCount = INTEGRATION_GROUPS
    .flatMap((g) => g.integrations)
    .filter((i) => i.status === 'error').length

  return (
    <div className="flex flex-col gap-6 p-5" dir="rtl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Integration Hub</h1>
          <p className="text-xs text-gray-400">البنية التحتية التقنية للمنصة — ربط وإدارة جميع الخدمات الخارجية</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            {connectedCount} متصل
          </span>
          {errorCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {errorCount} خطأ
            </span>
          )}
        </div>
      </div>

      {/* Integration Groups */}
      {INTEGRATION_GROUPS.map((group) => (
        <div key={group.category}>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-800">{group.label}</h2>
            <p className="text-xs text-gray-400">{group.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.integrations.map((itg) => (
              <IntegrationCard key={itg.id} integration={itg} />
            ))}
          </div>
        </div>
      ))}

      {/* API Logs */}
      <ApiLogsPanel />

    </div>
  )
}