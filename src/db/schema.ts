import {
    pgTable,
    uuid,
    text,
    timestamp,
    numeric,
    boolean,
    varchar,
  } from 'drizzle-orm/pg-core'
  
  /**
   * USERS (affiliates)
   */
  export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  
  /**
   * REFERRAL LINKS
   * Each user can have multiple links (for campaigns)
   */
  export const referralLinks = pgTable('referral_links', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
  
    code: varchar('code', { length: 50 }).notNull().unique(), // e.g. "SAIF123"
    label: varchar('label', { length: 255 }), // optional: "instagram campaign"
  
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  
  /**
   * CLICKS TRACKING
   */
  export const referralClicks = pgTable('referral_clicks', {
    id: uuid('id').defaultRandom().primaryKey(),
  
    referralLinkId: uuid('referral_link_id')
      .notNull()
      .references(() => referralLinks.id),
  
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    sessionId: varchar('session_id', { length: 128 }), // for deduplication
  
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  
  /**
   * ORDERS
   * Linked to referral (nullable if organic)
   */
  export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
  
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  
    referralLinkId: uuid('referral_link_id').references(() => referralLinks.id),
  
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  
  /**
   * COMMISSIONS
   * Separate table for flexibility (rates, refunds, status)
   */
  export const commissions = pgTable('commissions', {
    id: uuid('id').defaultRandom().primaryKey(),
  
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
  
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
  
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  
    status: varchar('status', { length: 50 }).default('pending').notNull(), // pending | approved | paid | canceled
  
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  
  /**
   * OPTIONAL: PAYOUTS (if you want withdrawals later)
   */
  export const payouts = pgTable('payouts', {
    id: uuid('id').defaultRandom().primaryKey(),
  
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
  
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  
    paid: boolean('paid').default(false).notNull(),
  
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })
  