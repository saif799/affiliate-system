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
    deleted_at: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_affiliate_referral_active')
      .on(table.referral_code)
      .where(sql`${table.deleted_at} IS NULL`),
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
      .references(() => merchantProfiles.id),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'),
    thumbnail_url: text('thumbnail_url'),
    image_urls: text('image_urls').array(),
    video_url: text('video_url'),
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
      .references(() => products.id),
    affiliate_id: uuid('affiliate_id')
      .notNull()
      .references(() => affiliateProfiles.id),
    slug: text('slug').notNull(),
    sub_id: text('sub_id'),
    click_count: integer('click_count').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
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
      .references(() => products.id),
    affiliate_id: uuid('affiliate_id').references(() => affiliateProfiles.id),
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchantProfiles.id),
    tracking_link_id: uuid('tracking_link_id').references(
      () => trackingLinks.id,
    ),
    customer_name: text('customer_name').notNull(),
    customer_phone: text('customer_phone').notNull(),
    customer_wilaya: text('customer_wilaya').notNull(),
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
    created_at: timestamp('created_at').notNull().defaultNow(),
    confirmed_at: timestamp('confirmed_at'),
    shipped_at: timestamp('shipped_at'),
    at_wilaya_at: timestamp('at_wilaya_at'),
    delivered_at: timestamp('delivered_at'),
    settled_at: timestamp('settled_at'),
    
  },
  (table) => [
    index('idx_orders_merchant_id').on(table.merchant_id),
    index('idx_orders_affiliate_id').on(table.affiliate_id),
    index('idx_orders_tracking_link_id').on(table.tracking_link_id),
    index('idx_orders_customer_wilaya').on(table.customer_wilaya),
    index('idx_orders_status_created').on(table.status, table.created_at),
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
// WALLETS
// ============================================================

export const wallets = pgTable(
  'wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id)
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
      .references(() => wallets.id),
    order_id: uuid('order_id').references(() => orders.id),
    related_txn_id: uuid('related_txn_id').references(
      (): AnyPgColumn => transactions.id,
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
      .references(() => users.id),
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
