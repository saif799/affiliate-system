export type IntegrationStatus = 'connected' | 'disconnected' | 'error'

export type IntegrationCategory =
  | 'ecommerce'      // منصات التجارة الإلكترونية
  | 'automation'     // أدوات الأتمتة
  | 'notifications'  // قنوات الإشعارات
// ملاحظة: التوصيل (delivery) لم يَعُد فئة هنا — يُدار من Settings → التوصيل.

export interface Integration {
  id:           string
  name:         string
  description:  string
  icon:         string           // emoji مؤقت — يُستبدل بصورة حقيقية لاحقاً
  iconBg:       string           // لون خلفية الأيقونة
  category:     IntegrationCategory
  status:       IntegrationStatus
  lastSync?:    string           // "منذ 3 دقائق" — فقط إذا متصل
  docsUrl?:     string
  comingSoon?:  boolean
}

export interface IntegrationGroup {
  category:     IntegrationCategory
  label:        string
  description:  string
  integrations: Integration[]
}