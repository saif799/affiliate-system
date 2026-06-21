import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  numeric,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'merchant',
  'affiliate',
  'system',
])

export const acctStatusEnum = pgEnum('acct_status', [
  'pending',
  'active',
  'suspended',
])

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'shipped',
  'at_wilaya',
  'delivered',
  'returned',
  'cancelled',
  'disputed',
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'commission',
  'merchant_earning',
  'platform_fee',
  'withdrawal',
  'refund',
])

export const txnStatusEnum = pgEnum('txn_status', [
  'pending',
  'completed',
  'reversed',
])

export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'pending',
  'approved',
  'rejected',
  'paid',
])



export const payoutMethodEnum = pgEnum('payout_method', ['CCP', 'BaridiMob'])

// نوع التوصيل: منزلي أو مكتب (stop-desk) — Phase 1
export const deliveryTypeEnum = pgEnum('delivery_type', ['home', 'office'])



export const notificationTypeEnum = pgEnum('notification_type', [
  'order_new',          // طلبية جديدة جاهزة للتجهيز (للتاجر)
  'order_status',       // تغيّر حالة طلبية
  'commission_earned',  // عمولة جديدة (للمسوّق)
  'earning_received',   // أرباح جديدة (للتاجر)
  'withdrawal_request', // طلب سحب جديد (للأدمن)
  'withdrawal_update',  // تحديث طلب سحب (للمستخدم)
  'low_stock',          // مخزون منخفض / نافد
  'system',             // إشعار عام
])

// ============================================================
// USERS
// ============================================================

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    phone: text('phone'),
    wilaya: text('wilaya'),
    role: userRoleEnum('role').notNull().default('affiliate'),
    status: acctStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    approved_at: timestamp('approved_at'),
    deleted_at: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_users_email_active')
      .on(table.email)
      .where(sql`${table.deleted_at} IS NULL`),
  ],
)

// ============================================================
// SESSIONS (better-auth)
// ============================================================

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ============================================================
// ACCOUNTS (better-auth)
// ============================================================

// schema.ts
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('idx_accounts_user_provider').on(table.userId, table.providerId),
])
// ============================================================
// VERIFICATIONS (better-auth)
// ============================================================

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ============================================================
// MERCHANT_PROFILES
// ============================================================

export const merchantProfiles = pgTable('merchant_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' })
    .unique(),
  business_name: text('business_name').notNull(),
  address: text('address'),
  deleted_at: timestamp('deleted_at'),
})

// ============================================================
// AFFILIATE_PROFILES
// ============================================================

export const affiliateProfiles = pgTable(
  'affiliate_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' })
      .unique(),
    referral_code: text('referral_code').notNull(),
    refusal_rate: numeric('refusal_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    fraud_flag: boolean('fraud_flag').notNull().default(false),
    // مفتاح استيراد الطلبيات الخارجية (extension على متجر المسوّق: WooCommerce/Shopify…).
    // يُولّد عند الطلب ويُرسَل في ترويسة x-api-key لمصادقة نقطة /api/ingest/order.
    ingest_api_key: text('ingest_api_key'),
    deleted_at: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_affiliate_referral_active')
      .on(table.referral_code)
      .where(sql`${table.deleted_at} IS NULL`),
    uniqueIndex('idx_affiliate_ingest_key')
      .on(table.ingest_api_key)
      .where(sql`${table.ingest_api_key} IS NOT NULL`),
    sql`CONSTRAINT chk_refusal_rate_range
        CHECK (${table.refusal_rate} >= 0 AND ${table.refusal_rate} <= 100)`,
  ],
)

// ============================================================
// SETTINGS
// ============================================================

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ============================================================
// PRODUCTS
// ============================================================

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchantProfiles.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'),
    thumbnail_url: text('thumbnail_url'),
    image_urls: text('image_urls').array(),
    video_url: text('video_url'),
    // روابط إضافية يضيفها التاجر (فيديوهات إعلانية، صفحات هبوط…) — تُعرض للمسوّق
    links: text('links').array(),
    merchant_price_dzd: integer('merchant_price_dzd').notNull(),
    wholesale_price_dzd: integer('wholesale_price_dzd'),
    stock_qty: integer('stock_qty').notNull().default(0),
    low_stock_threshold: integer('low_stock_threshold').notNull().default(10),
    sku: text('sku'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deleted_at: timestamp('deleted_at'),
  },
  (table) => [
    index('idx_products_merchant_id').on(table.merchant_id),
    index('idx_products_category').on(table.category),
    index('idx_products_is_active_deleted').on(
      table.is_active,
      table.deleted_at,
    ),
    sql`CONSTRAINT chk_merchant_price_positive
        CHECK (${table.merchant_price_dzd} >= 0)`,
    sql`CONSTRAINT chk_stock_positive
        CHECK (${table.stock_qty} >= 0)`,
  ],
)

// ============================================================
// TRACKING_LINKS
// ============================================================

export const trackingLinks = pgTable(
  'tracking_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    affiliate_id: uuid('affiliate_id')
      .notNull()
      .references(() => affiliateProfiles.id, { onDelete: 'restrict' }),
    slug: text('slug').notNull(),
    sub_id: text('sub_id'),
    click_count: integer('click_count').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),

    // ── إعدادات صفحة بيع المسوّق (Landing) — تُملأ عند نشر صفحة مخصّصة لهذا الرابط ──
    // المسوّق يضبط سعر المنتج (لكل قطعة)؛ التوصيل يُحسب حسب الولاية على صفحة الهبوط.
    landing_enabled: boolean('landing_enabled').notNull().default(false),
    sale_price_dzd: integer('sale_price_dzd'), // سعر المنتج الذي حدّده المسوّق
    landing_title: text('landing_title'),
    landing_description: text('landing_description'),
    landing_images: text('landing_images').array(), // صور مختارة/مضافة من المسوّق
    // التوصيل مجاني (يتحمّله المسوّق من ربحه) لكل نوع
    free_office_delivery: boolean('free_office_delivery').notNull().default(false),
    free_home_delivery: boolean('free_home_delivery').notNull().default(false),
    accent_color: text('accent_color'), // لون التمييز (hex) لتخصيص الصفحة
  },
  (table) => [
    uniqueIndex('idx_tracking_slug_active')
      .on(table.slug)
      .where(sql`${table.is_active} = true`),
    index('idx_tracking_affiliate_id').on(table.affiliate_id),
    index('idx_tracking_product_id').on(table.product_id),
    sql`CONSTRAINT chk_click_count_positive
        CHECK (${table.click_count} >= 0)`,
  ],
)

// ============================================================
// ORDERS
// ============================================================

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    affiliate_id: uuid('affiliate_id').notNull().references(() => affiliateProfiles.id, {
      onDelete: 'restrict',
    }),
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchantProfiles.id, { onDelete: 'restrict' }),
    tracking_link_id: uuid('tracking_link_id').references(
      () => trackingLinks.id,
      { onDelete: 'set null' },
    ),
    customer_name: text('customer_name').notNull(),
    customer_phone: text('customer_phone').notNull(),
    customer_wilaya: text('customer_wilaya').notNull(),
    // بيانات منطقة التوصيل المطلوبة لإنشاء الشحنة في ECOTRACK
    // (تُختار من قوائم ECOTRACK نفسها لضمان قبول create/order).
    customer_wilaya_code: integer('customer_wilaya_code'), // 1..58 (IDWilaya لدى ECOTRACK)
    customer_commune: text('customer_commune'), // اسم البلدية كما لدى ECOTRACK
    customer_address: text('customer_address'), // العنوان (مطلوب للتوصيل المنزلي)
    customer_note: text('customer_note'), // ملاحظة للتاجر/شركة التوصيل (remarque)
    quantity: integer('quantity').notNull().default(1),
    unit_affiliate_price_dzd: integer('unit_affiliate_price_dzd').notNull(),
    unit_merchant_price_dzd: integer('unit_merchant_price_dzd').notNull(),
    // رسوم المنصة الثابتة لكل طلبية مُسلَّمة — تُؤخذ من الطرفين
    platform_fee_merchant_dzd: integer('platform_fee_merchant_dzd').notNull().default(0),
    platform_fee_affiliate_dzd: integer('platform_fee_affiliate_dzd').notNull().default(0),
    // الإجمالي (= رسم التاجر + رسم المسوّق) — يُختزن للتقارير
    platform_fee_dzd: integer('platform_fee_dzd').notNull().default(0),
    shipping_fee_dzd: integer('shipping_fee_dzd').notNull().default(0),
    status: orderStatusEnum('status').notNull().default('pending'),
    tracking_number: text('tracking_number'),
    return_reason: text('return_reason'),
    // مصدر الطلبية الخارجي (extension) — لمنع الاستيراد المكرّر
    external_source: text('external_source'),
    external_order_id: text('external_order_id'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    confirmed_at: timestamp('confirmed_at'),
    shipped_at: timestamp('shipped_at'),
    at_wilaya_at: timestamp('at_wilaya_at'),
    delivered_at: timestamp('delivered_at'),
    settled_at: timestamp('settled_at'),
    // ── تكامل ECOTRACK للتوصيل ──
    // رقم التتبّع يُخزَّن في tracking_number الموجود (لا عمود مكرّر).
    ecotrack_account_id: uuid('ecotrack_account_id').references(
      () => deliveryAccounts.id,
      { onDelete: 'set null' },
    ),
    delivery_status: text('delivery_status').default('pending'),
    returned_at: timestamp('returned_at'),

    // ── نوع التوصيل + المكتب + سعر التوصيل (Phase 1/6) ──
    // المكتب مرجع داخلي فقط (ECOTRACK لا يقبل office_id؛ يُرسَل commune+stop_desk).
    // سعر التوصيل المُختار يُخزَّن في shipping_fee_dzd الموجود (لقطة للعرض/التقارير).
    delivery_type: deliveryTypeEnum('delivery_type').notNull().default('home'),
    delivery_office_id: uuid('delivery_office_id').references(
      () => deliveryOffices.id,
      { onDelete: 'set null' },
    ),

    // ── الملصق الداخلي + طباعة الملصق الرسمي (Phase 5) ──
    internal_shipment_id: text('internal_shipment_id'), // مرجع بشريّ مقروء (SHP-…)
    qr_token: text('qr_token'), // توكن HMAC المُرمَّز في رمز QR (ليس معرّف الطلب الخام)
    label_printed_at: timestamp('label_printed_at'), // وقت طباعة الأدمن للملصق الرسمي
    label_token_used_at: timestamp('label_token_used_at'), // منع إعادة الاستخدام (ذرّي)

    // ── اختناق الاستطلاع + التراجع الأُسّي لكل طلبية (Phase 3) ──
    delivery_polled_at: timestamp('delivery_polled_at'),
    delivery_poll_failures: integer('delivery_poll_failures').notNull().default(0),
    delivery_next_poll_at: timestamp('delivery_next_poll_at'),
  },
  (table) => [
    index('idx_orders_merchant_id').on(table.merchant_id),
    index('idx_orders_affiliate_id').on(table.affiliate_id),
    index('idx_orders_tracking_link_id').on(table.tracking_link_id),
    index('idx_orders_customer_wilaya').on(table.customer_wilaya),
    index('idx_orders_status_created').on(table.status, table.created_at),
    // منع استيراد نفس الطلبية الخارجية مرتين (idempotency) — بنطاق المسوّق كي لا
    // تتصادم طلبات متجرَي مسوّقَين مختلفَين تحملان نفس (source, external_order_id).
    uniqueIndex('idx_orders_external_unique')
      .on(table.affiliate_id, table.external_source, table.external_order_id)
      .where(sql`${table.external_order_id} IS NOT NULL`),
    // مرجع الشحنة الداخلي فريد (Phase 5) — جزئي لأنّه يُملأ عند الشحن فقط
    uniqueIndex('idx_orders_internal_shipment')
      .on(table.internal_shipment_id)
      .where(sql`${table.internal_shipment_id} IS NOT NULL`),
    // لوحة شحنات الأدمن: الشحنات التي تنتظر طباعة الملصق (Phase 5)
    index('idx_orders_label_pending').on(table.status, table.label_printed_at),
    // اختيار الطلبيات المستحقّة للاستطلاع (Phase 3)
    index('idx_orders_poll').on(table.status, table.delivery_next_poll_at),
    sql`CONSTRAINT chk_quantity_positive
        CHECK (${table.quantity} > 0)`,
    sql`CONSTRAINT chk_prices_positive CHECK (
      ${table.unit_affiliate_price_dzd}   >= 0 AND
      ${table.unit_merchant_price_dzd}    >= 0 AND
      ${table.platform_fee_merchant_dzd}  >= 0 AND
      ${table.platform_fee_affiliate_dzd} >= 0 AND
      ${table.platform_fee_dzd}           >= 0 AND
      ${table.shipping_fee_dzd}           >= 0
    )`,
  ],
)


// ============================================================
  // orderHistory
// hda zidto 3la gal bah n9adro n3arfo sharika tawsill mliha wla la 

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    from_status: orderStatusEnum('from_status'),
    to_status: orderStatusEnum('to_status').notNull(), // ✅ هذا الناقص
    occurred_at: timestamp('occurred_at').notNull().defaultNow(),
    source: text('source').notNull().default('system'),
    note: text('note'),
  },
  (table) => [
    index('idx_status_history_order_id').on(table.order_id),
    index('idx_status_history_occurred_at').on(table.occurred_at),
  ],
)

// ============================================================
// DELIVERY ACCOUNTS — حسابات شركات التوصيل (ECOTRACK، متعدّد الحسابات)
// ============================================================

export const deliveryAccounts = pgTable(
  'delivery_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    provider: text('provider').notNull().default('ecotrack'),
    api_key: text('api_key').notNull(),
    // قاعدة الـ API الخاصة بحساب المُرسِل (ECOTRACK منصّة white-label؛ لكل
    // ناقل نطاقه، مثل https://dhd.ecotrack.dz). فارغ ⇒ يُستخدم ECOTRACK_BASE_URL.
    base_url: text('base_url'),
    is_active: boolean('is_active').notNull().default(true),
    is_default: boolean('is_default').notNull().default(false),
    deleted_at: timestamp('deleted_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // حساب افتراضي واحد فقط لكل مزوّد (قيد جزئي على مستوى DB)
    uniqueIndex('idx_delivery_accounts_default')
      .on(table.provider)
      .where(sql`${table.is_default} = true AND ${table.deleted_at} IS NULL`),
  ],
)

// ============================================================
// DELIVERY_PRICING — تعرفة التوصيل لكل ولاية (تُزامَن من ECOTRACK get/fees،
// قابلة لتجاوز الأدمن). المصدر الوحيد للسعر المعروض في نموذج الطلبية (Phase 6).
// ============================================================

export const deliveryPricing = pgTable(
  'delivery_pricing',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wilaya_id: integer('wilaya_id').notNull(), // IDWilaya لدى ECOTRACK (1..58)
    wilaya_name: text('wilaya_name').notNull(), // من get/wilayas
    home_price_dzd: integer('home_price_dzd').notNull(), // get/fees .tarif
    office_price_dzd: integer('office_price_dzd').notNull(), // get/fees .tarif_stopdesk
    admin_override: boolean('admin_override').notNull().default(false),
    last_synced_at: timestamp('last_synced_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('idx_delivery_pricing_wilaya').on(table.wilaya_id),
    sql`CONSTRAINT chk_delivery_prices_positive CHECK (
      ${table.home_price_dzd} >= 0 AND ${table.office_price_dzd} >= 0
    )`,
  ],
)

// ============================================================
// DELIVERY_OFFICES — البلديات (ومكاتب stop-desk) لكل ولاية (تُزامَن من get/communes).
// مهم: ECOTRACK لا يوفّر سجلّ مكاتب ولا office_id؛ "المكتب" = بلدية has_stop_desk=1.
// نُخزّن كل البلديات مع علم has_stop_desk فيخدم الجدول مُنتقي المنزل والمكتب معاً،
// ولا يحتاج نموذج الطلبية لاستدعاء ECOTRACK مباشرةً أبداً (Phase 6).
// ============================================================

export const deliveryOffices = pgTable(
  'delivery_offices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wilaya_id: integer('wilaya_id').notNull(),
    office_code: text('office_code').notNull(), // مفتاح ثابت: `${wilaya_id}:${commune}`
    name: text('name').notNull(), // اسم البلدية (موقع stop-desk عند توفّره)
    address: text('address'), // code_postal أو فارغ (ECOTRACK لا يوفّر عنوان شارع)
    has_stop_desk: boolean('has_stop_desk').notNull().default(false),
    last_synced_at: timestamp('last_synced_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_delivery_offices_code').on(table.wilaya_id, table.office_code),
    index('idx_delivery_offices_wilaya').on(table.wilaya_id),
  ],
)

// ============================================================
// LABEL_PRINT_AUDIT — سجلّ كل محاولة طباعة ملصق رسمي (Phase 5، مكافحة الاحتيال).
// نُسجّل النجاح والفشل معاً (توقيع غير صالح / منتهٍ / مُستخدَم / خطأ ECOTRACK).
// ============================================================

export const labelPrintAudit = pgTable(
  'label_print_audit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    actor_user_id: text('actor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(), // 'print_attempt'
    result: text('result').notNull(), // success | invalid_signature | expired | already_used | ecotrack_error
    detail: text('detail'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_label_audit_order').on(table.order_id),
    index('idx_label_audit_created').on(table.created_at),
  ],
)

// ============================================================
// ORDER TRACKING EVENTS — أرشيف محلّي لأحداث تتبّع ECOTRACK
// ============================================================

export const orderTrackingEvents = pgTable(
  'order_tracking_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: text('status').notNull(), // حالة ECOTRACK الخام (livre, en_transit…)
    status_label: text('status_label').notNull(), // التسمية العربية
    description: text('description'),
    wilaya: text('wilaya'),
    occurred_at: timestamp('occurred_at').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_tracking_events_order_id').on(table.order_id),
    index('idx_tracking_events_occurred_at').on(table.occurred_at),
    // idempotency: لا تُكرَّر نفس الحدث (نفس الطلب + الحالة + الوقت)
    uniqueIndex('idx_tracking_events_unique').on(
      table.order_id,
      table.status,
      table.occurred_at,
    ),
  ],
)

// ============================================================
// ORDER COMMENTS — خيط محادثة لكل طلبية (مسوّق/تاجر/أدمن)
// يسمح للمسوّق بإضافة ملاحظات/تعليقات ومتابعتها على طلبيته.
// ============================================================

export const orderComments = pgTable(
  'order_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    author_user_id: text('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    author_role: userRoleEnum('author_role').notNull(),
    body: text('body').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_order_comments_order').on(table.order_id, table.created_at),
  ],
)

// ============================================================
// WARNING REPLIES — ردود التاجر/المسوّق على تنبيهات الإدارة (محادثة ثنائية)
// التنبيه نفسه مُخزَّن في verifications (identifier=warning:<userId>)؛ هذا الجدول
// يحمل الردود المرتبطة به (warning_id = verifications.id) من الطرفين.
// ============================================================

export const warningReplies = pgTable(
  'warning_replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    warning_id: text('warning_id').notNull(), // = verifications.id للتنبيه الأصلي
    target_user_id: text('target_user_id') // صاحب الخيط (التاجر/المسوّق المُنذَر)
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    author_user_id: text('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    author_role: userRoleEnum('author_role').notNull(),
    body: text('body').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_warning_replies_warning').on(table.warning_id, table.created_at),
    index('idx_warning_replies_target').on(table.target_user_id),
  ],
)

// ============================================================
// WALLETS
// ============================================================

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' })
      .unique(),
    available_balance_dzd: integer('available_balance_dzd')
      .notNull()
      .default(0),
    pending_balance_dzd: integer('pending_balance_dzd').notNull().default(0),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    sql`CONSTRAINT chk_available_balance
        CHECK (${table.available_balance_dzd} >= 0)`,
    sql`CONSTRAINT chk_pending_balance
        CHECK (${table.pending_balance_dzd} >= 0)`,
  ],
)

// ============================================================
// TRANSACTIONS
// ============================================================

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wallet_id: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),
    order_id: uuid('order_id').references(() => orders.id, {
      onDelete: 'restrict',
    }),
    related_txn_id: uuid('related_txn_id').references(
      (): AnyPgColumn => transactions.id,
      { onDelete: 'set null' },
    ),
    type: transactionTypeEnum('type').notNull(),
    status: txnStatusEnum('status').notNull().default('pending'),
    amount_dzd: integer('amount_dzd').notNull(),
    description: text('description'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_transactions_wallet_id').on(table.wallet_id),
    index('idx_transactions_order_id').on(table.order_id),
    index('idx_transactions_type').on(table.type),
    index('idx_transactions_created_at').on(table.created_at),
    // اختيار المعاملات المستحقّة للتحرير (releaseAllMaturedFunds): status='pending' + created_at<=cutoff
    index('idx_transactions_status_created').on(table.status, table.created_at),
    sql`CONSTRAINT chk_amount_not_zero
        CHECK (${table.amount_dzd} != 0)`,
  ],
)

// ============================================================
// WITHDRAWAL_REQUESTS
// ============================================================

export const withdrawalRequests = pgTable(
  'withdrawal_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    amount_dzd: integer('amount_dzd').notNull(),
    method: payoutMethodEnum('method').notNull(),
    account_number: text('account_number').notNull(),
    status: withdrawalStatusEnum('status').notNull().default('pending'),
    requested_at: timestamp('requested_at').notNull().defaultNow(),
    processed_at: timestamp('processed_at'),
  },
  (table) => [
    index('idx_withdrawals_status_user').on(table.status, table.user_id),
    sql`CONSTRAINT chk_withdrawal_amount
        CHECK (${table.amount_dzd} > 0)`,
  ],
)

// ============================================================
// NOTIFICATIONS — لكل مستخدم (مسوّق/تاجر/أدمن)
// ============================================================



export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'), // مسار داخلي للنقر (مثلاً /merchant/orders)
    read_at: timestamp('read_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_notifications_user_unread').on(table.user_id, table.read_at),
    index('idx_notifications_user_created').on(table.user_id, table.created_at),
  ],
)
