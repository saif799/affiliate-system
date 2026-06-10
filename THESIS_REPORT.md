# COMPLETE TECHNICAL PROJECT REPORT
## *Foundation Document for a Master's Thesis in Software Engineering*

> **Note on language:** The codebase ships its end-user copy in Arabic (RTL) and French. This report is written in English (academic register) for thesis use, but it preserves the original terminology where it carries domain meaning (e.g., *wilaya*, *commune*, *stop-desk*, *COD*).

---

## PART 1 — PROJECT OVERVIEW

### 1.1 Project Identity

- **Project name:** **DzDrop** — A Multi-Sided Affiliate / Dropshipping Platform for the Algerian Market.
- **Repository slug:** `affiliate-system`.
- **Domain:** B2B2C e-commerce — specifically *affiliate marketing* and *dropshipping* in a Cash-on-Delivery (COD) economy.
- **Geographic scope:** Algeria (DZD currency, 58 wilayas, Arabic / French / RTL interface).
- **Delivery partner:** **ECOTRACK** (white-label carrier platform; deployed against the DHD instance at `platform.dhd-dz.com`).
- **Authentication:** Self-service e-mail/password + invitation-based magic-links.

### 1.2 Business Problem

E-commerce in Algeria operates under a triad of constraints that conventional Western affiliate platforms (Shopify Collabs, Amazon Associates, Awin) do not address:

1. **Cash-on-Delivery dominance.** Card penetration is low and online wallets are nascent. Settlement cannot occur at checkout; it must occur *after the carrier confirms collection*.
2. **Carrier-mediated last mile.** A handful of national carriers (Yalidine, ZR Express, DHD-EcoTrack) own the wilaya-level distribution graph. Any platform that ignores them ships nothing.
3. **Fragmented trust.** A merchant rarely trusts a marketer to handle PII (customer phone, address). A marketer rarely trusts a merchant to honour commission. Both rely on the platform to act as escrow.

Existing solutions are either (a) general marketplaces (Jumia) that subordinate marketers to a single brand, or (b) ad-hoc Facebook/Instagram affiliate flows with no settlement guarantees and no fraud controls.

### 1.3 Proposed Solution

DzDrop is a **three-sided full-stack web platform** that intermediates between merchants (product owners), affiliates (independent marketers), and customers (end buyers), with a fourth implicit side — the **carrier** — abstracted behind an ECOTRACK adapter. It enforces three guarantees:

1. **Financial guarantee** — a settlement engine that holds commission and merchant earnings in escrow (`pending_balance`) until a delivery is confirmed, then releases them after a configurable clearance period (`clearance_days`, default 2 days).
2. **Operational guarantee** — automated shipment creation with the carrier on a single click; status polled from ECOTRACK every 15 minutes; idempotency and concurrency safety guard against double-charging or double-shipping.
3. **Privacy guarantee** — defense-in-depth role-based privacy: the merchant *never sees* customer PII (name, phone, address, home commune, note), even if a query accidentally selects those columns; a server-side sanitisation layer (`toMerchantOrderView`) is the last gate.

### 1.4 Target Users

| Role | Population | Primary value proposition |
|---|---|---|
| **Super Admin** (platform staff) | Internal team | Approves merchants, manages payouts (CCP / BaridiMob), oversees carrier accounts, sets platform fees and clearance windows. |
| **Merchant** | SME product owners with inventory | Lists products at wholesale price, ships only after marketer-confirmed orders, receives earnings minus platform fee per order. |
| **Affiliate** (marketer) | Independent sellers, social-media operators | Picks products from the marketplace, generates a tracking link or enters a manual lead, sets retail price freely, pockets `(retail − wholesale − shipping − platform fee)` per delivered order. |
| **Customer** | Algerian end buyers | Receives the parcel from the carrier; pays in cash at handover. **Not a platform user** — interacts only with the carrier. |

### 1.5 Academic Framing (for the Thesis Introduction)

DzDrop is positioned as a case study in *resilient distributed financial workflows under adversarial integration constraints*. The system must reconcile three asynchronous event sources — internal user actions, external carrier polling, and time-based cron triggers — into a consistent ledger without losing money, leaking PII, or generating duplicate shipments. The architectural and algorithmic choices (idempotent state transitions, HMAC-signed printable tokens, atomic claim/release of stock and shipping, exponential back-off per order during status polling, role-aware data sanitisation) are precisely the kinds of trade-offs that justify the report's depth.

---

## PART 2 — REQUIREMENTS ANALYSIS

### 2.1 Functional Requirements (extracted from source)

The list below is **derived from implementation**, not from a wish-list. Each item is traceable to one or more files.

#### FR-1 — Multi-role authentication & onboarding
- **Inputs:** Email, password, name, phone, optional wilaya, requested role (`merchant` | `affiliate`).
- **Outputs:** A user row in `users`, a profile row in `merchant_profiles` or `affiliate_profiles`, a session cookie via `better-auth`.
- **Sub-flows:** (a) Self-service registration (status forced to `pending`, role clamped to merchant/affiliate). (b) Admin invitation via magic-link issuing through Gmail in dev / Resend in production. (c) Set-password flow on first magic-link landing.
- **Source:** `src/server/auth.ts`, `src/routes/_auth.register.tsx`, `src/routes/set-password.tsx`, `src/routes/_dashboard/merchants/-server/merchants.api.ts`.

#### FR-2 — Admin merchant/affiliate lifecycle
- **Inputs:** Super-admin actions: invite, approve join, reject, suspend, send warning, delete (soft).
- **Outputs:** Mutation on `users.status` (active/suspended), `users.deleted_at` (soft delete), or a record in `verifications` (used as a warnings store via `identifier='warning:<userId>'`).
- **Roles:** `super_admin` only (guarded via `requireSuperAdmin`).
- **Source:** `src/routes/_dashboard/merchants/-server/merchants.api.ts` + analogous `affiliates.api.ts`.

#### FR-3 — Product catalogue management
- **Inputs (merchant):** product name, description, category, image set (≤5), wholesale price, stock quantity, low-stock threshold.
- **Outputs:** A row in `products` with image URLs persisted via the storage layer (`saveImage`), and a derived `is_active` that auto-syncs with stock (stock=0 ⇒ deactivate; restored ⇒ reactivate; manual pause preserved).
- **Constraints:** ≤ 5 MB per image; MIME whitelist (jpg/png/webp/gif); soft delete via `deleted_at`.
- **Source:** `src/routes/merchant/products/-server/products.api.ts`, `src/server/storage.ts`.

#### FR-4 — Affiliate marketplace browsing & link generation
- **Inputs:** Affiliate browses; selects product + optional `subId`.
- **Outputs:** A tracking link `${APP_URL}/p/${slug}` backed by `tracking_links`. Re-use is enforced: same affiliate × product × subId ⇒ same slug, not a duplicate row.
- **Source:** `src/routes/affiliate/marketplace/-server/marketplace.api.ts`.

#### FR-5 — Order capture (manual lead)
- **Inputs:** product, customer name/phone, wilayaCode (1–58), wilayaName, officeId, deliveryType (home/office), address, salePrice, optional notes.
- **Server-side checks:** product active and in stock; office belongs to chosen wilaya; if office delivery requested, the commune must have `has_stop_desk = true`; `salePrice ≥ merchantPrice + deliveryPrice` (the affiliate cannot sell below cost).
- **Outputs:** A row in `orders` with full snapshot of unit prices, platform fees (read from `settings`), and shipping fee (read from `delivery_pricing`).
- **Source:** `addLeadManual` in `src/routes/affiliate/orders/-server/orders.api.ts`.

#### FR-6 — Order confirmation / rejection (affiliate decision)
- **Inputs:** orderId.
- **Server logic:** Lock the order row (`FOR UPDATE`); lock the product row; on confirm, decrement stock atomically inside the same transaction; insert a row in `order_status_history`; trigger `notify(merchant)` and a `low_stock` notification if `newStock ≤ threshold`.
- **Outputs:** `orders.status` transitions `pending → confirmed` (or `pending → cancelled`).
- **Concurrency:** Double-clicks and concurrent calls are linearised by the row lock.
- **Source:** `confirmLead`, `rejectLead` in `src/routes/affiliate/orders/-server/orders.api.ts`.

#### FR-7 — Merchant ship-out (single-click)
- **Inputs:** orderId.
- **Server logic (three-phase commit):**
  1. *Atomic claim*: lock the order, decide via `decideShipClaim(...)` whether the action is `already` (idempotent), `bad_status`, `in_flight` (concurrent caller), `resume` (stalled previous attempt — re-uses internal_shipment_id), or `fresh`. Generates `internal_shipment_id` and signs a `qr_token` (HMAC-SHA256, 72h TTL).
  2. *External call (outside lock)*: `ecotrack.createOrder({ reference: order.id, … })` — `reference` doubles as the carrier-side deduplication key.
  3. *Atomic finalize*: store tracking number, mutate to `shipped`, insert history row, notify super-admins.
- **Failure path:** any error in phase 2 releases the claim (`internal_shipment_id`, `qr_token` reset to NULL) so the merchant can retry.
- **Source:** `shipOrder` in `src/routes/merchant/orders/-server/orders.api.ts`, `decideShipClaim` in `src/server/delivery/label.ts`.

#### FR-8 — Internal label generation
- **Inputs:** orderId.
- **Outputs:** A printable label containing `internal_shipment_id`, a QR code that encodes the **signed token** (not the raw order id), the delivery type, office name (if office delivery), wilaya, and creation time. **No PII appears on the label.**
- **Source:** `getInternalLabel` in `src/routes/merchant/orders/-server/orders.api.ts`, `src/server/delivery/label.ts`.

#### FR-9 — Carrier status polling & state machine
- **Inputs:** Periodic cron (`/api/cron/sync-tracking`).
- **Server logic:** Selects orders in `shipped` or `at_wilaya` whose `delivery_next_poll_at ≤ NOW()`. For each, fetches `get/tracking/info` from ECOTRACK; for each activity event, calls `applyEcotrackEvent(...)` which (a) writes a unique row in `order_tracking_events`, (b) forward-only advances `orders.status` according to a rank map, (c) on `delivered` triggers `processPayout(...)`, (d) on `returned` recomputes `affiliateProfiles.refusal_rate`.
- **Robustness:** Per-order exponential back-off on failures (`POLL_TTL_MS = 15 min`, max 24h), so a dead tracking number does not exhaust the API quota.
- **Source:** `src/server/delivery/ecotrack-sync.ts`, `src/routes/api/cron/sync-tracking.ts`.

#### FR-10 — Settlement & escrow
- **Inputs:** Order id (delivered).
- **Server formula (pure & unit-tested):**
  - `commission = max(0, (affiliatePrice − merchantPrice) × qty − feeAffiliate − shippingFee)`
  - `merchantEarning = max(0, merchantPrice × qty − feeMerchant)`
  - `platformFee = feeAffiliate + feeMerchant`
- **Outputs:** Insertions into `transactions` (affiliate commission `pending`, merchant earning `pending`, platform fee `completed`); mutation of `wallets.pending_balance_dzd` and the system wallet's `available_balance_dzd`; `orders.settled_at` stamped.
- **Idempotency:** Re-entrant by `settled_at` check + row lock.
- **Source:** `src/server/settlement.ts`, `src/server/settlement-math.ts`, `src/server/services/payout.service.ts`.

#### FR-11 — Funds release (clearance)
- **Inputs:** Cron (`/api/cron/release-funds`) and lazy trigger on wallet open / before withdrawal.
- **Server logic:** For each user whose wallet has `pending` transactions older than `clearance_days` (configurable in `settings`), advance them to `completed` and move the sum from `pending_balance_dzd` to `available_balance_dzd` — under a wallet-row `FOR UPDATE` lock.
- **Source:** `releaseMaturedFunds` in `src/server/settlement.ts`, `src/routes/api/cron/release-funds.ts`.

#### FR-12 — Withdrawal request lifecycle
- **Inputs:** Amount (≥ `minimum_payout`), method (CCP | BaridiMob), account number.
- **State machine:** `pending → approved → paid`, or `pending → rejected`. Each transition is admin-driven (`approveWithdrawal`, `confirmWithdrawal`, `rejectWithdrawal`).
- **Constraints:** At most one open request per user (pending + approved); `available_balance_dzd` is decremented atomically at request time; on rejection it is refunded; on approval the rollback is no longer possible (`paid` is terminal).
- **Source:** `createWithdrawalRequest` in `src/routes/affiliate/wallet/-server/wallet.api.ts`, `confirmWithdrawal` in `src/routes/_dashboard/commissions/-server/commissions.api.ts`.

#### FR-13 — Dispute lifecycle
- **States:** Any active order can be marked `disputed` (carrier-side conflict, customer denies receipt). Admin resolves into `delivered` (triggers settlement), `returned` (recomputes refusal_rate), or `cancelled` (no financial effect).
- **Source:** `flagOrderDisputed`, `resolveDispute` in `src/server/settlement.ts`.

#### FR-14 — Return request (merchant initiated, post-delivery)
- **Constraint:** Allowed only within 48 hours of delivery and only by the order's merchant.
- **Action:** Calls `ecotrack.addTrackingNote` (best-effort, since ECOTRACK does not accept a reason on `ask/for/order/return`), then `ecotrack.requestReturn`.
- **Source:** `requestOrderReturn` in `src/server/delivery/tracking.api.ts`.

#### FR-15 — Notifications
- **In-app bell:** Reads `notifications` table; per-user read state via `read_at` timestamp.
- **Trigger points:** Order new (to merchant), status change (to affiliate/merchant), commission earned, earnings received, withdrawal request (broadcast to super-admins), withdrawal update, low stock, generic system.
- **Source:** `src/server/notify.ts`, `src/server/notifications.ts`.

#### FR-16 — Delivery-catalogue synchronisation
- **Frequency:** Daily cron (`/api/cron/sync-catalog`).
- **Sync targets:** `delivery_pricing` (per-wilaya home + office price) and `delivery_offices` (every commune, with `has_stop_desk` flag) — pulled from `get/wilayas`, `get/fees`, `get/communes`.
- **Override safety:** A row with `admin_override = true` is **not** overwritten unless `?force=1` is passed; the protection is enforced *atomically inside the UPSERT* (not a read-then-write race).
- **Source:** `src/server/delivery/catalog-sync.ts`.

#### FR-17 — Carrier account management
- **Object:** Multiple ECOTRACK accounts (multi-tenant carrier white-labels).
- **CRUD:** Create / update / soft-delete / toggle active / set default; "default per provider" is enforced by a partial unique index on `delivery_accounts(provider) WHERE is_default = true AND deleted_at IS NULL`.
- **Privacy:** API keys are *never* sent to the client; only the last 8 characters are returned, masked.
- **Source:** `src/routes/_dashboard/integration/-server/delivery.api.ts`.

#### FR-18 — Analytics & dashboards
- **Super admin:** GMV, platform revenue, conversions, pending commissions, monthly revenue series, top affiliates, wilaya distribution, recent activity stream.
- **Merchant:** Wallet KPIs, recent orders, top products, low-stock alerts, overview chart.
- **Affiliate:** Stats cards, top merchants, recent activity.
- **Source:** Each role's `dashboard/-server/dashboard.api.ts`.

### 2.2 Non-Functional Requirements

| NFR | Mechanism in code |
|---|---|
| **Security** | (a) Per-route `beforeLoad` guards; (b) per-server-fn `requireSession/Merchant/Affiliate/SuperAdmin`; (c) `role` clamped server-side on self-registration (`super_admin`/`system` collapsed to `affiliate`); (d) `status` not accepting user input (`input: false`); (e) constant-time HMAC compares for cron secret and label token; (f) rate limit on `/sign-in/email`, `/sign-up/email`, `/magic-link/verify`. |
| **Privacy** | RBAC sanitisation layer: `toMerchantOrderView` strips customer PII; queries also select only non-PII columns by default. |
| **Concurrency / Correctness** | (a) `FOR UPDATE` row locks around stock decrement, settlement, ship claim, dispute resolution, withdrawal decisions; (b) idempotency via `settled_at`, `external_order_id` partial unique index, `internal_shipment_id` partial unique index, unique `(order_id, status, occurred_at)` on tracking events; (c) `onConflictDoNothing` for the wallet bootstrap race. |
| **Performance** | (a) Composite indexes on hot filters: `idx_orders_status_created`, `idx_transactions_status_created`, `idx_notifications_user_unread`, `idx_orders_poll`; (b) all monetary values stored as integer DZD (no floating point); (c) shipping/fee captured at order time (snapshot) so reports do not re-aggregate live. |
| **Reliability** | (a) Best-effort wrappers around all notifications (errors swallowed, logged); (b) per-order exponential back-off on polling failures (cap 24h); (c) magic-link send rollback (delete user + profile if email send fails); (d) automatic redirect-following with method preservation for ECOTRACK (fixes the POST→GET 301 trap). |
| **Maintainability** | (a) `#/*` path alias removes deep relative imports; (b) single source of truth: schema → drizzle types → API types; (c) the file convention `-server/`, `-components/`, `-X.types.ts` colocates a feature; (d) `routeTree.gen.ts` auto-generated, never hand-edited. |
| **Availability** | Stateless server functions; postgres is the only stateful dependency. Cron endpoints are externally driven (Vercel Cron / GitHub Actions), making the app horizontally scalable. |
| **Usability** | RTL Arabic UI; per-role bespoke sidebars with role-appropriate KPIs; wallet balance shown in nav; pending-approval landing screen explains state. |
| **Auditability** | (a) `order_status_history` for every status change with `source` (system/merchant/affiliate/admin); (b) `label_print_audit` for every official label print attempt with `result` (success / invalid_signature / expired / already_used / ecotrack_error); (c) `transactions.related_txn_id` for refund/reversal traceability. |

---

## PART 3 — SYSTEM ARCHITECTURE

### 3.1 Architectural Style

DzDrop is a **monolithic full-stack SSR application built on TanStack Start (Vite + React 19 + TanStack Router)** with **server functions** as the integration primitive between client components and the database. The style is best described as **modular monolith with a hexagonal core**:

- The **core domain** (settlement math, status state machine, label token verification, ship-claim decision) is **pure** and located in `src/server/` with companion unit tests.
- The **adapters** are isolated: the database adapter (`drizzle` over `postgres-js`), the carrier adapter (`EcotrackService` class), the storage adapter (`saveImage` with `STORAGE_DRIVER` swap), and the e-mail adapter (Gmail vs Resend by `NODE_ENV`).
- The **delivery layer** is a thin TanStack Start route per feature, calling server functions which call core domain logic which calls adapters.

### 3.2 Layered View

```
┌───────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│   React 19 components (RTL, Arabic), Tailwind v4, lucide-react,    │
│   recharts, radix-ui, shadcn/ui (new-york, base = zinc)            │
├───────────────────────────────────────────────────────────────────┤
│                  ROUTING / SESSION LAYER (TanStack)                │
│   • Auto-generated routeTree.gen.ts (file-based)                   │
│   • __root.tsx: beforeLoad → getSession → injected into context    │
│   • Per-layout beforeLoad: role / status guards                    │
├───────────────────────────────────────────────────────────────────┤
│                    SERVER-FUNCTION LAYER (RPC)                     │
│   createServerFn({ method }).inputValidator(zod).handler(...)      │
│   Per-feature: -server/<feature>.api.ts                            │
│   Calls auth guards (requireXxx) — single point of authorisation   │
├───────────────────────────────────────────────────────────────────┤
│                       DOMAIN / SERVICE LAYER                       │
│   src/server/                                                      │
│   ├── settlement.ts            (transactional money movements)     │
│   ├── settlement-math.ts       (pure formula, unit-tested)         │
│   ├── delivery/                                                     │
│   │   ├── ecotrack-sync.ts     (status state machine)              │
│   │   ├── catalog-sync.ts      (wilayas / communes / fees)         │
│   │   ├── label.ts             (HMAC token + ship-claim decision)  │
│   │   └── tracking.api.ts      (RBAC tracking view)                │
│   ├── services/                                                     │
│   │   ├── ecotrack.service.ts  (HTTP client, retries, follow 301)  │
│   │   └── payout.service.ts    (orchestrates settle on delivery)   │
│   ├── privacy/order-views.ts   (RBAC sanitisation)                 │
│   ├── auth/guards.ts           (role gate helpers)                 │
│   ├── notify.ts                (best-effort notifications)         │
│   ├── storage.ts               (file-storage abstraction)          │
│   └── cron.ts                  (constant-time secret check)        │
├───────────────────────────────────────────────────────────────────┤
│                        PERSISTENCE LAYER                           │
│   Drizzle ORM over postgres-js → PostgreSQL                        │
│   schema.ts: 17 tables, pg enums, partial unique indexes,          │
│   CHECK constraints, soft-deletes (deleted_at)                     │
└───────────────────────────────────────────────────────────────────┘

           ┌──────────────────────┐                ┌────────────────┐
           │   ECOTRACK / DHD     │  ←─ pull ──    │   /api/cron/*  │
           │  platform.dhd-dz.com │   poll API     │   external     │
           └──────────────────────┘                │   scheduler    │
                                                   └────────────────┘
```

### 3.3 Module Topology

The application is decomposed into **portals × features**:

```
Portals (route layouts with role guards)
├── /_dashboard  → Super Admin   (10 features)
├── /merchant    → Merchant      (6 features)
├── /affiliate   → Affiliate     (5 features)
├── /_auth       → Login/Register (auth-only)
├── /pending-approval (waiting room)
└── /set-password    (post-magic-link)

Features (each feature is self-contained)
├── dashboard/    (per-role KPI overview)
├── orders/       (per-role order operations)
├── products/     (merchant; admin: catalogue-wide)
├── marketplace/  (affiliate-only product picker)
├── wallet/       (per-role; admin equivalent = /commissions)
├── settings/     (per-role)
├── analytics/    (admin)
├── merchants/    (admin)
├── affiliates/   (admin)
├── commissions/  (admin payout console)
├── integration/  (admin; ECOTRACK accounts + pricing)
└── shipments/    (admin; pending label print queue)

API routes (server-only handlers)
├── /api/auth/$               (better-auth catch-all)
├── /api/cron/sync-tracking   (every ~15 min)
├── /api/cron/release-funds   (hourly)
├── /api/cron/sync-catalog    (daily)
└── /api/webhooks/ecotrack    (TOMBSTONE — returns 410)
```

### 3.4 Architectural Rationale

| Decision | Justification |
|---|---|
| **Modular monolith over microservices** | The data model is tightly coupled (every order touches users, products, wallets, transactions, tracking events). Splitting it would force distributed transactions for settlement — a worse trade than a single-DB transaction. |
| **TanStack Start (SSR + RPC server functions)** over Next.js / Remix | Co-locates types and validation: a `createServerFn` is both an API endpoint and an importable function; the client can call it as if it were local, with Zod input validation enforced server-side. Eliminates dual-typing of API contracts. |
| **Drizzle ORM** over Prisma | Drizzle keeps SQL semantics (CHECK constraints, partial indexes, `FOR UPDATE`, `sql\`…\`` templated SQL) at first class; Prisma abstracts them away. The settlement code uses `sql\`…\`` heavily — a sign Drizzle was the right call. |
| **PostgreSQL** | Required by the financial workflow: row-level locks (`FOR UPDATE`), partial unique indexes, CHECK constraints, transactional DDL, and `pg_enum` for typed status columns. |
| **better-auth** over rolled-own JWT | Battle-tested rate limiting; magic-link plugin; database hooks for post-create profile bootstrap; `tanstackStartCookies()` integrates session cookies with TanStack Start's request lifecycle. |
| **ECOTRACK pull (cron) instead of webhooks** | ECOTRACK does not document a webhook contract. Pulling makes the integration self-healing (a missed event is recovered on next poll) and removes the attack surface of a public webhook endpoint. The `/api/webhooks/ecotrack` tombstone documents the decision. |
| **Single carrier abstraction** (`EcotrackService`) with **multi-account** support | The Algerian carrier market is small but volatile. The `delivery_accounts` table + `getEcotrackClient(accountId)` make swapping or adding carriers a configuration change, not a refactor. |

### 3.5 Limitations of the Current Architecture

- **No background-job runner.** Cron is externally triggered; if no Vercel Cron / GitHub Action is wired up, money is never released and shipments never sync. The 503 fallback (`CRON_SECRET not set`) at least makes the misconfiguration loud.
- **No event bus.** Cross-feature side effects (notify, recompute refusal rate) are imperative function calls. Adding a fifth side effect to "delivery confirmed" requires touching `applyEcotrackEvent` and `processPayout`.
- **Tight coupling to PostgreSQL.** The settlement engine assumes `FOR UPDATE` semantics. A MySQL port would require revisiting locking.
- **No DLQ (dead-letter queue).** Failed notifications are logged but not retried; failed ECOTRACK pushes are retried inline with back-off but not durably queued.

---

## PART 4 — DATABASE ANALYSIS

### 4.1 Inventory

**17 user-managed tables + 4 better-auth-managed tables (subset).** All declared in `src/server/db/schema.ts` and migrated via `drizzle-kit`.

```
ENUMS
  user_role          super_admin | merchant | affiliate | system
  acct_status        pending | active | suspended
  order_status       pending | confirmed | shipped | at_wilaya |
                     delivered | returned | cancelled | disputed
  transaction_type   commission | merchant_earning | platform_fee |
                     withdrawal | refund
  txn_status         pending | completed | reversed
  withdrawal_status  pending | approved | rejected | paid
  payout_method      CCP | BaridiMob
  delivery_type      home | office
  notification_type  order_new | order_status | commission_earned |
                     earning_received | withdrawal_request |
                     withdrawal_update | low_stock | system

TABLES
  users                         identity + role + status (better-auth)
  sessions                      session cookies (better-auth)
  accounts                      provider credentials (better-auth)
  verifications                 magic-link tokens + warning store
  merchant_profiles             business-side data
  affiliate_profiles            referral code + refusal_rate + fraud
  settings                      key-value config (clearance_days, fees)
  products                      catalogue
  tracking_links                affiliate → product short URLs
  orders                        the central ledger of intent + delivery
  order_status_history          audit trail (every transition)
  order_tracking_events         ECOTRACK event archive
  delivery_accounts             carrier API accounts (multi-tenant)
  delivery_pricing              per-wilaya home/office price
  delivery_offices              communes + has_stop_desk flag
  label_print_audit             admin label-print attempts
  wallets                       per-user available + pending balance
  transactions                  money entries (linked to wallet+order)
  withdrawal_requests           payout requests (CCP / BaridiMob)
  notifications                 in-app bell content
```

### 4.2 Entity Descriptions

#### Identity & Profiles

**`users`** — every actor on the platform.
- *Attributes*: `id (PK, text — better-auth subject id)`, `name`, `email`, `email_verified`, `phone`, `wilaya`, `role` (enum), `status` (enum), `created_at`, `updated_at`, `approved_at`, `deleted_at`.
- *Constraints*: a **partial unique index** `idx_users_email_active` on `email` where `deleted_at IS NULL` — allows email reuse after soft deletion without colliding with active accounts.
- *Relationships*: 1↔1 with `merchant_profiles` or `affiliate_profiles` depending on role; 1↔N with `sessions`, `notifications`, `withdrawal_requests`; 1↔1 with `wallets`.

**`merchant_profiles`** — business-side adjunct.
- *Attributes*: `id (UUID PK)`, `user_id (unique, restrict)`, `business_name`, `address`, `deleted_at`.
- *Auto-creation*: created by `databaseHooks.user.create.after` *unless* the invitation flow already created it.

**`affiliate_profiles`** — marketer-side adjunct.
- *Attributes*: `id (UUID PK)`, `user_id (unique, restrict)`, `referral_code`, `refusal_rate (numeric 5,2, default 0)`, `fraud_flag (boolean)`, `deleted_at`.
- *Constraints*: `CHECK (refusal_rate BETWEEN 0 AND 100)`, partial unique index on `referral_code` for active rows.

**`settings`** — key/value config (used for `platform_fee_merchant`, `platform_fee_affiliate`, `minimum_payout`, `clearance_days`, `payout_schedule`, `payout_methods`, `platform_name`, `support_email`, `terms_url`, `privacy_url`, `maintenance_mode`).

#### Catalogue & Tracking

**`products`**.
- *Attributes*: `id`, `merchant_id`, `name`, `description`, `category`, `thumbnail_url`, `image_urls[]`, `video_url`, `merchant_price_dzd`, `wholesale_price_dzd`, `stock_qty`, `low_stock_threshold`, `sku`, `is_active`, `deleted_at`.
- *Constraints*: `CHECK (merchant_price_dzd ≥ 0)`, `CHECK (stock_qty ≥ 0)`; indexes on `merchant_id`, `category`, `(is_active, deleted_at)`.
- *Soft delete*: `deleted_at`.

**`tracking_links`**.
- *Attributes*: `id`, `product_id`, `affiliate_id`, `slug`, `sub_id`, `click_count`, `is_active`, `expires_at`, `created_at`.
- *Constraints*: partial unique on `slug` where `is_active=true`; `CHECK (click_count ≥ 0)`.

#### The Order — The Central Object

**`orders`** is the most heavily annotated table in the schema. It snapshots prices, fees, delivery metadata, and *both* the platform-side state machine and the carrier-side raw status.

- *Identity*: `id (UUID PK)`, `product_id`, `affiliate_id (nullable — for direct merchant orders)`, `merchant_id`, `tracking_link_id (nullable)`.
- *Customer block*: `customer_name`, `customer_phone`, `customer_wilaya`, `customer_wilaya_code (1..58)`, `customer_commune` (must match ECOTRACK), `customer_address`, `customer_note`.
- *Financial snapshot* (immutable post-creation): `quantity`, `unit_affiliate_price_dzd`, `unit_merchant_price_dzd`, `platform_fee_merchant_dzd`, `platform_fee_affiliate_dzd`, `platform_fee_dzd`, `shipping_fee_dzd`.
- *Platform state machine*: `status (enum)`, `confirmed_at`, `shipped_at`, `at_wilaya_at`, `delivered_at`, `returned_at`, `settled_at`.
- *External source tracking* (deduplication when an order is imported from a browser extension): `external_source`, `external_order_id`, with partial unique index on the pair.
- *Carrier integration*: `tracking_number`, `ecotrack_account_id (FK delivery_accounts)`, `delivery_status` (raw ECOTRACK code).
- *Delivery preference*: `delivery_type (home|office)`, `delivery_office_id (FK delivery_offices)`.
- *Label authority*: `internal_shipment_id` (human-readable `SHP-XXXXXXXX`), `qr_token` (HMAC-signed), `label_printed_at`, `label_token_used_at` (single-use enforcement).
- *Polling throttle*: `delivery_polled_at`, `delivery_poll_failures`, `delivery_next_poll_at`.
- *Constraints*: `CHECK (quantity > 0)`, `CHECK (all monetary fields ≥ 0)`; partial unique on `internal_shipment_id` where non-null; indexes on `merchant_id`, `affiliate_id`, `tracking_link_id`, `customer_wilaya`, `(status, created_at)`, `(status, label_printed_at)`, `(status, delivery_next_poll_at)`.

**`order_status_history`** — every transition recorded with `from_status`, `to_status`, `occurred_at`, `source` (system/merchant/affiliate/admin), `note`.

**`order_tracking_events`** — every ECOTRACK activity event archived, with **unique `(order_id, status, occurred_at)`** as the idempotency key.

#### Delivery Catalogue (synced from ECOTRACK)

- **`delivery_accounts`** — multi-tenant carrier accounts. Partial unique index guarantees one default per provider for non-deleted rows.
- **`delivery_pricing`** — `wilaya_id (PK-like, unique)`, `wilaya_name`, `home_price_dzd`, `office_price_dzd`, `admin_override (bool)`, `last_synced_at`.
- **`delivery_offices`** — `wilaya_id`, `office_code = ${wilaya_id}:${commune}`, `name (commune)`, `address (code postal)`, `has_stop_desk (bool)`. Indexed by wilaya for the marketplace dropdown.

#### Money

**`wallets`** — one per user. `available_balance_dzd` (withdrawable), `pending_balance_dzd` (held during clearance). Both `CHECK (≥ 0)`.

**`transactions`** — append-only ledger. `wallet_id`, `order_id (nullable)`, `related_txn_id (self-ref, nullable)`, `type`, `status`, `amount_dzd`, `description`. `CHECK (amount_dzd != 0)`. Composite index `(status, created_at)` powers the funds-release sweeper.

**`withdrawal_requests`** — `user_id`, `amount_dzd`, `method`, `account_number`, `status`, `requested_at`, `processed_at`. `CHECK (amount_dzd > 0)`. Composite index `(status, user_id)` powers the "one-open-request" guard.

#### Auxiliary

- **`label_print_audit`** — every official label print attempt with `actor_user_id`, `action`, `result` (`success | invalid_signature | expired | already_used | ecotrack_error`), `detail`.
- **`notifications`** — `user_id`, `type`, `title`, `body`, `link`, `read_at`. Composite indexes `(user_id, read_at)` and `(user_id, created_at)`.

### 4.3 ERD Description (textual)

```
                          ┌────────────────────┐
                          │       users        │
                          │  id (text, PK)     │
                          │  role, status      │
                          └─┬─────────────┬────┘
              1:1          │             │           1:1
       ┌──────────────┐    │             │      ┌──────────────────┐
       │ merchant_    │◄───┘             └────► │ affiliate_       │
       │  profiles    │                         │  profiles        │
       │  id (uuid)   │                         │  id (uuid)       │
       └──────┬───────┘                         └─────────┬────────┘
              │ 1:N (restrict)                            │ 1:N
              ▼                                            │
       ┌──────────────┐                                    │
       │  products    │◄──────────────────────┐            │
       │  id (uuid)   │     N:1               │            │
       └──────┬───────┘                       │            │
              │ 1:N                           │            │
              │                          ┌────┴────────────┴────┐
              └─────────────────────────►│        orders         │◄────┐
                                          │  id (uuid)            │     │
                                          │  status, prices,      │     │
                                          │  customer PII,        │     │
                                          │  shipping snapshot,   │     │
                                          │  internal_shipment_id │     │
                                          └────┬───────┬──────────┘     │
                                               │       │                 │
                                  cascade 1:N  │       │ 1:N restrict    │
                          ┌────────────────────┘       └──────────┐     │
                          ▼                                       ▼     │
              ┌────────────────────────┐               ┌──────────────────┐
              │  order_status_history  │               │  transactions    │
              └────────────────────────┘               │ wallet_id, type, │
                                                       │ status, amount   │
                                                       └────┬─────────────┘
                                                            │ N:1 restrict
                                                            ▼
                                                       ┌──────────┐
                                                       │ wallets  │  1:1 with users
                                                       └──────────┘

   orders ─ N:1 ► tracking_links ─ N:1 ► products (sales attribution)
   orders ─ N:1 ► delivery_accounts (which carrier API account shipped this)
   orders ─ N:1 ► delivery_offices (chosen commune)
   orders ─ 1:N ► order_tracking_events (ECOTRACK activity archive)
   orders ─ 1:N ► label_print_audit (admin print attempts)

   delivery_pricing (per-wilaya, no FK from orders — looked up by code)
   delivery_offices (per-wilaya commune list — FK from orders if office)

   users  ─ 1:N ► notifications (cascade)
   users  ─ 1:N ► withdrawal_requests (restrict)
```

### 4.4 Notable Schema Patterns

- **Soft-delete-aware uniqueness.** All e-mail/referral uniqueness is filtered on `deleted_at IS NULL`. Deletion does not lock the natural key.
- **Money as integer.** Every monetary column is `integer`, units of DZD. No floating-point. `CHECK (≥ 0)` keeps the ledger sane.
- **Partial unique indexes as concurrency primitives.** The "claim ship" pattern works because `internal_shipment_id` becomes non-null atomically inside the row lock — a concurrent caller observes it and is rejected.
- **Self-referential transactions.** `related_txn_id` enables future refund/reversal chains without a separate refund table.
- **Carrier event archive with natural-key idempotency.** `unique (order_id, status, occurred_at)` is the canonical pattern for replaying an external event source safely.

---

## PART 5 — BACKEND ANALYSIS

### 5.1 Framework & Conventions

The backend lives **inside the same TanStack Start application** as the frontend. There is no separate Node/Express server; instead:

- **`createServerFn({ method }).inputValidator(zod).handler(...)`** is the canonical RPC primitive. The handler runs on the server, the call site looks like an ordinary `await` from React.
- **API routes** (under `src/routes/api/`) expose raw HTTP handlers for two cases only: (a) better-auth's catch-all (`/api/auth/$`), (b) cron triggers.
- **All authorisation goes through `requireSession | requireSuperAdmin | requireMerchant | requireAffiliate`** in `src/server/auth/guards.ts`. This is the single point of authorisation drift control.

### 5.2 Route Organisation

The convention codified in `CLAUDE.md` is:

```
src/routes/<portal>/<feature>/
├── index.tsx                   route component
├── -<feature>.types.ts         feature types (the leading `-` excludes
│                               the file from route generation)
├── -server/<feature>.api.ts    server functions
├── -components/                feature-specific components
└── -<feature>.mock.ts          (optional) demo data
```

`src/routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin` and re-written on every dev save. Manual edits are forbidden.

### 5.3 Validation & Error Handling

Every mutation uses **Zod** schemas at the boundary:

```ts
const AddLeadSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(9).max(20),
  wilayaCode: z.number().int().min(1).max(58),
  // …
})
```

Errors are thrown as plain `Error`s with Arabic-language messages directly usable in the UI. The pattern is intentional: there is no `try/catch` boilerplate in routes; failures bubble to TanStack Router's error boundary.

### 5.4 Authorisation as a Layered Defense

1. **Layout-level guard** (`beforeLoad` in `_dashboard.tsx`, `merchant.tsx`, `affiliate.tsx`) — checks `context.session.user.role`. This is the first line; a wrong-role user is redirected before any data loads.
2. **Server-function guard** (`requireXxx`) — re-checks the session inside every handler. Layout guards can be bypassed by direct RPC calls; the second check stops it.
3. **Query scope** — every query has a `WHERE` clause binding to the caller's profile id (`eq(orders.merchant_id, profileId)`, etc.). Even if guards were bypassed, the query would return zero rows.
4. **Privacy sanitisation** — for merchant order views, `toMerchantOrderView` *re-constructs* the projected object without copying PII fields. This protects against accidental column selections.

### 5.5 Concurrency Primitives

**Row locks** are everywhere money or stock moves:

| Operation | Lock target | Why |
|---|---|---|
| `confirmLead` | `orders` then `products` | Prevent double-decrement of stock on rapid clicks. |
| `shipOrder` | `orders` | Three-state ship-claim decision (already / in_flight / resume / fresh) is atomic. |
| `settleOrderTx` | `orders` | Prevent the merchant button and the carrier polling from running settlement twice. |
| `releaseMaturedFundsTx` | `wallets` | Prevent two simultaneous releases from double-crediting available_balance. |
| `createWithdrawalRequest` | `wallets` | Plus a re-check of "one open request" inside the lock to close the time-of-check / time-of-use gap. |
| `confirmWithdrawal`/`reject` | `withdrawal_requests` | Prevent double settlement of a payout. |
| `flagOrderDisputedTx`/`resolveDisputeTx` | `orders` | Status transition + financial effect in one transaction. |
| `applyEcotrackEvent` | `orders` | Idempotent event application against a moving status target. |

### 5.6 Major Endpoints (Selected)

#### POST `confirmLead` (Affiliate)
- *Request*: `{ orderId: uuid }`
- *Guard*: `requireAffiliate`; query bound to `affiliate_id = profileId`.
- *Effect*: Row-locked stock decrement + status `pending→confirmed` + status history + best-effort notifications to merchant and (if low stock) to affiliate.
- *Response*: `{ success: true }`.
- *Errors*: "الطلبية غير موجودة", "لا يمكن تأكيد هذه الطلبية في حالتها الحالية", "المخزون غير كافٍ".

#### POST `shipOrder` (Merchant)
- *Request*: `{ orderId: uuid }`
- *Guard*: `requireMerchant`; query bound to `merchant_id = profileId`.
- *Effect*: Atomic claim → external ECOTRACK `create/order` (with `reference = order.id` for deduplication) → finalize with tracking number + `shipped` status + status history + super-admin notification.
- *Response*: `{ success: true, tracking: <string> }`.
- *Failure semantics*: If the external call throws, the claim is released and the order stays `confirmed`.

#### POST `createWithdrawalRequest` (Affiliate)
- *Request*: `{ amount: int, method: 'CCP'|'BaridiMob', accountNumber: string }`
- *Guard*: `requireAffiliate`.
- *Pre-check (outside lock)*: minimum payout (from settings), "no other open request".
- *Lock + final check*: wallet `FOR UPDATE`, re-check open request, re-check balance, decrement `available_balance_dzd` by amount, insert pending withdrawal request.
- *Post*: notify all super-admins.
- *Response*: A `WithdrawalRequest` view with display-friendly reference `WD-…`.

#### POST `/api/cron/sync-tracking` (Internal cron)
- *Headers*: `x-cron-secret: <CRON_SECRET>` (constant-time compared).
- *Effect*: Selects all active orders due for polling, fetches ECOTRACK tracking info, applies events idempotently, advances status, triggers settlement on `delivered`, updates poll throttle (success → +15min, failure → exponential back-off capped at 24h).
- *Response*: `{ ok: true, orders: N, updated: M }`.

#### POST `confirmWithdrawal` (Super Admin)
- *Request*: `{ withdrawalId: uuid, transactionRef: string }`
- *Guard*: `requireSuperAdmin`.
- *State guard*: rejects if not in `approved` state.
- *Effect*: status → `paid`, processed_at set, withdrawal transaction inserted as `completed` (with negative amount, just for the audit trail — balance was already debited at request time).

---

## PART 6 — FRONTEND ANALYSIS

### 6.1 Framework Stack

- **React 19** (concurrent + transitions).
- **TanStack Router** (file-based, SSR, type-safe links, route loaders with race-condition-safe data fetching).
- **TanStack Query** (cached server state on the client; wired through `tanstack-query/root-provider.tsx`).
- **TanStack Form** (for the few complex multi-step forms).
- **Tailwind CSS v4** (`@tailwindcss/vite`) with the **shadcn/ui** ecosystem (style `new-york`, base color `zinc`).
- **lucide-react** icons, **recharts** for graphs, **radix-ui** primitives, **tw-animate-css** for entrance animations.
- **qrcode** to render QR codes server-side as data URLs.

### 6.2 Architecture & Composition

The frontend follows a **route-as-feature** pattern. Each feature folder is self-contained:

```
src/routes/affiliate/orders/
├── index.tsx                  the route component
├── -orders.types.ts           AffiliateOrder, OrderStatus, …
├── -server/orders.api.ts      server functions (importable client-side)
└── -components/
    ├── AddLeadModal.tsx
    ├── EditOrderModal.tsx
    ├── OrdersStats.tsx
    └── …
```

**Loader-driven data fetching.** Each route declares a `loader` that calls the server function. The loader runs server-side during SSR and client-side on subsequent navigations; the data is consumed via `useLoaderData()`. The pattern is visible in `src/routes/_dashboard/dashboard/index.tsx`:

```tsx
export const Route = createFileRoute('/_dashboard/dashboard/')({
  loader: () => getDashboardData(),
  pendingComponent: () => <Spinner />,
  component: DashboardPage,
})
```

### 6.3 Routing & Auth Flow

The **routing tree** is generated from the file system; the **session** is loaded once at the root and injected into router context. Every nested layout's `beforeLoad` reads `context.session` synchronously and either passes or redirects:

```tsx
// src/routes/__root.tsx
beforeLoad: async () => {
  const session = await getSession()
  return { session }
}

// src/routes/merchant.tsx
beforeLoad: ({ context, location }) => {
  if (!context.session) throw redirect({ to: '/login' })
  if (context.session.user.status !== 'active')
    throw redirect({ to: '/pending-approval' })
  if (context.session.user.role !== 'merchant')
    throw redirect({ to: '/login' })
  if (location.pathname === '/merchant')
    throw redirect({ to: '/merchant/dashboard', search: { range: '7days' } })
}
```

The `_auth.tsx` layout handles the *inverse* case: if a logged-in user reaches `/login`, redirect them to the correct dashboard for their role.

### 6.4 State Management Strategy

DzDrop deliberately **avoids client-side state libraries** (no Redux, no Zustand) for domain data. The pattern is:

- **Server-owned state** → loader + `useLoaderData()` + revalidation after mutations.
- **UI-owned state** → component-local `useState`.
- **Cross-component shared UI state** (e.g. notification bell open state) → kept in the bell component.
- **Session** → router context (immutable per request).

This is a deliberate simplification: with `createServerFn` being typed and validated at the boundary, the client can call it directly without an intermediate cache layer for most operations.

### 6.5 UI Organisation Per Portal

- **`/dashboard` (Super Admin)** — wide blue palette, 10 sections (dashboard, orders, shipments, affiliates, merchants, products, commissions, analytics, integration, settings).
- **`/merchant`** — orange palette, 6 sections (dashboard, orders, products, affiliates, wallet, settings), wallet balance in sidebar.
- **`/affiliate`** — violet palette, 5 sections (dashboard, orders, marketplace, wallet, settings), wallet balance in sidebar.

All three layouts share:
- A top-of-sidebar `NotificationBell` polling unread count from `getMyNotifications`.
- A user-name pill.
- An RTL Arabic interface with `dir="rtl"` set at the `<html>` root.

### 6.6 Theme & Accessibility

The root document ships an inline pre-paint script (`THEME_INIT_SCRIPT`) that reads `localStorage.theme`, resolves `auto` against `prefers-color-scheme`, and applies `dark`/`light` classes *before React mounts*. This eliminates flash-of-wrong-theme on hydration.

---

## PART 7 — AUTHENTICATION & SECURITY

### 7.1 Authentication

**Engine:** `better-auth@^1.6.9` over a Drizzle adapter against PostgreSQL.

**Mechanisms:**

1. **E-mail + password** (self-service). Login through `signIn.email({ email, password })`. Sessions are cookie-based via `tanstackStartCookies()` plugin.
2. **Magic-link invitation** (admin-driven). Triggered by `auth.api.signInMagicLink({ body: { email, callbackURL: '/set-password' } })`. Mail is sent through Gmail SMTP in `development` and Resend in production. The email template is *role-aware* — admin / merchant / affiliate each get a distinct HTML body, picked from a `pendingInviteTypes` map keyed by lowercase e-mail.

**Rate limiting** (in `auth.ts`):
```ts
rateLimit: {
  enabled: true,
  window: 60,
  max: 100,
  customRules: {
    '/sign-in/email':       { window: 60, max: 5 },
    '/sign-up/email':       { window: 60, max: 5 },
    '/magic-link/verify':   { window: 60, max: 10 },
  },
}
```

### 7.2 Authorisation (RBAC)

**Roles** (enumerated): `super_admin`, `merchant`, `affiliate`, `system` (reserved — owns the platform-fee ledger).

**Enforcement (defense-in-depth):**
1. **Layout guard** — `beforeLoad` redirect at `_dashboard.tsx`, `merchant.tsx`, `affiliate.tsx`.
2. **Server-function guard** — `requireSuperAdmin | requireMerchant | requireAffiliate` re-verifies the session inside every handler. Critically, `requireMerchant` and `requireAffiliate` also resolve the caller's `profile_id` from `merchant_profiles` / `affiliate_profiles`, eliminating a separate query in handlers.
3. **Query scope** — all SELECT/UPDATE statements filter by the caller's profile id.
4. **Privacy view layer** — for the merchant role, an extra sanitisation function (`toMerchantOrderView`) strips customer PII from query results.

### 7.3 Critical Security Hardening — Role Clamp on Self-Registration

Self-registration via `/sign-up/email` is publicly reachable. better-auth's additional-fields mechanism allows the role to be *requested* but the application **clamps it server-side** before insert:

```ts
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        const requested = (user as { role?: unknown }).role
        const safeRole = requested === 'merchant' ? 'merchant' : 'affiliate'
        return { data: { ...user, role: safeRole, status: 'pending' } }
      },
      // …
    },
  },
}
```

Any payload sending `role: "super_admin"` or `role: "system"` is **silently downgraded** to `affiliate`. `status` is `input: false` so it can never be `active` on self-sign-up. Invitation flows insert directly via Drizzle and bypass this hook — the only legitimate path to elevated roles.

### 7.4 Magic-Link Security

- The token is a single-use verification row in `verifications`, generated and verified by better-auth.
- The send is *role-aware*: `setInviteType(email, type)` stashes the desired role; the magic-link send callback reads + deletes the entry, defaulting to `'admin'` if not present (failsafe — never escalates).
- Failure to send rolls back the inserted `users` + `merchant_profiles` rows so the slot can be reused.

### 7.5 Label Token Security (Phase 5)

A printable internal label for the merchant carries a QR code. The QR encodes a token of shape:

```
v1.<internal_shipment_id>.<issued_at_ms>.<base64url(HMAC_SHA256(payload, SECRET))>
```

Verified by `verifyLabelToken` (`src/server/delivery/label.ts`):
1. Format check (4 dot-segments, version `v1`).
2. **Constant-time signature compare** via `crypto.timingSafeEqual`. Length is checked first (safe — the secret length is constant).
3. TTL = 72 hours from `issued_at_ms`.
4. **Single-use** is enforced by `orders.label_token_used_at` mutated atomically when the admin prints the official label.
5. Every print attempt (success or failure) is logged in `label_print_audit` with the precise failure reason — an immutable audit trail.

The QR code does **not** encode the raw order id — it encodes the signed token, so an attacker reading the printed label gains nothing useful.

### 7.6 Cron Secret

The cron endpoints accept an `x-cron-secret` header compared with `timingSafeEqual` against `process.env.CRON_SECRET`. If the secret is unset, the endpoint returns **503** (fail-closed). Wrong secret returns 401.

### 7.7 Privacy Layer (RBAC Data Minimisation)

```ts
// src/server/privacy/order-views.ts
export function toMerchantOrderView(r: MerchantOrderRaw): Order {
  return {
    id: r.id,
    createdAt: toDay(r.createdAt),
    product: { name: r.productName, variant: r.productVariant ?? '' },
    wilaya: r.wilaya,
    deliveryType: r.deliveryType,
    officeName: r.deliveryType === 'office' ? r.officeName ?? undefined : undefined,
    quantity: r.quantity,
    totalPrice: r.totalPrice,
    merchantEarnings: r.merchantEarnings,
    status: r.status,
    dbStatus: r.dbStatus,
    trackingNumber: r.trackingNumber ?? undefined,
    internalShipmentId: r.internalShipmentId ?? undefined,
  }
}
```

The function **does not copy PII fields** (`customerName`, `customerPhone`, `customerAddress`, `customerCommune`, `customerNote`) even though they are declared in the input type. The type annotation acts as documentation: *these fields exist and are intentionally dropped*.

### 7.8 Other Security Surface

- **Soft delete + filtered uniqueness** keeps e-mail re-registration safe after deletion without ghost collisions.
- **OWASP coverage**: SQL injection blocked by Drizzle parameter binding; XSS minimised because all rendering goes through React's auto-escaping (no `dangerouslySetInnerHTML` outside the theme pre-paint script); CSRF mitigated by SameSite cookies (better-auth default).
- **Image upload** validates MIME, extension, and size (≤ 5 MB) in `src/server/storage.ts` before persisting.
- **API key masking** — `delivery_accounts.api_key` is *never* sent to the client; only the last 8 characters are returned, prefixed with bullets.

---

## PART 8 — PROJECT WORKFLOW

### 8.1 User Workflows

#### Affiliate Workflow — End-to-End

```
1. Register at /register, choose role = affiliate
     └─► server clamps role; status = pending; profile row + wallet row auto-created
2. Wait for admin approval at /pending-approval
3. Admin sets status = active in /dashboard/affiliates
4. Affiliate logs in → redirected to /affiliate/dashboard
5. Browses /affiliate/marketplace, sees: product, merchant, base price,
   delivered_rate, retour_rate, total_sales, stock
6. Two paths:
   a) Generate tracking link → share on social media → customer order
      (currently the /p/<slug> public funnel is not implemented;
      tracking links are stored but not actively used)
   b) Manual lead: open AddLeadModal, fill customer details,
      pick wilaya / commune / delivery type / sale price.
      Sale price ≥ wholesale + shipping (enforced server-side).
7. Order created with status = pending.
8. Affiliate sees the order in /affiliate/orders.
9. Affiliate confirms or rejects:
     - confirm → stock decremented, merchant notified
     - reject  → order = cancelled, no financial effect
10. Merchant ships → tracking number assigned → status = shipped
11. Cron polls ECOTRACK → status transitions to at_wilaya → delivered
12. On delivered: commission pushed to pending_balance
13. After clearance_days (default 2) → commission moves to available_balance
14. Affiliate requests withdrawal via CCP or BaridiMob
15. Admin approves → confirms → balance is paid out
```

#### Merchant Workflow

```
1. Receive invitation e-mail from admin (role-aware HTML)
2. Click magic link → /set-password → choose password
3. Land on /merchant/dashboard
4. Add products via /merchant/products (name, images, wholesale price,
   stock, category, low-stock threshold)
5. Wait for affiliate-confirmed orders to appear in /merchant/orders
   (only confirmed+ orders are visible — pending orders belong to affiliates)
6. Click "Ship": system claims the order, calls ECOTRACK create/order,
   stores tracking number, status → shipped
7. Click "Print Internal Label" → QR code + internal_shipment_id displayed
8. Hand the package + label to the carrier
9. Admin prints the official ECOTRACK label (admin only — fraud guard)
10. ECOTRACK status pulled → admin sees evolution → eventually delivered
11. Merchant earning moves through pending → available
12. Withdraw via CCP/BaridiMob (same flow as affiliate)
```

#### Super Admin Workflow

```
1. Log in at /login → /dashboard
2. Review platform KPIs (GMV, platform revenue, pending commissions)
3. Approve incoming merchant / affiliate join requests
4. Manage delivery accounts in /integration:
   - Add ECOTRACK account (name, API key, base URL, default flag)
   - Test connection via testDeliveryAccountConnection
   - Toggle active / set default / soft-delete
5. Manage delivery pricing per wilaya in /integration
   (admin_override toggles atomic protection in catalog-sync)
6. Process payouts in /commissions:
   - View withdrawal requests segmented by method (CCP, BaridiMob)
   - Inspect source: getWithdrawalSource lists which orders generated this balance
   - Approve → status = approved
   - Confirm payment with transaction reference → status = paid
   - Or reject → balance refunded
7. Print official ECOTRACK labels for pending shipments in /shipments
8. Configure platform settings: fees, clearance days, minimum payout, schedule
```

### 8.2 Business Workflows

#### Money Flow

```
Customer pays cash to carrier (COD)
            │
            ▼
ECOTRACK records "livred"
            │
            │ (cron polls every 15 min)
            ▼
applyEcotrackEvent → status = delivered → processPayout
            │
            ▼
settleOrderTx (in a single DB transaction):
    ┌─────────────────────────────────────────────┐
    │ commission       → affiliate.pending_balance │
    │ merchant_earning → merchant.pending_balance  │
    │ platform_fee     → system.available_balance  │
    │ orders.settled_at = now                      │
    └─────────────────────────────────────────────┘
            │
            │ (cron every hour OR lazy on wallet open)
            ▼
releaseMaturedFundsTx:
   pending tx older than clearance_days
        → tx.status = completed
        → wallet.pending → wallet.available
            │
            ▼
User requests withdrawal:
   wallet.available -= amount
   withdrawal_requests inserted as pending
            │
            ▼
Admin reviews source, approves
            │
            ▼
Admin confirms payment (CCP / BaridiMob),
   inserts withdrawal transaction (completed, negative amount),
   marks withdrawal as paid
```

#### Status Machine (Orders)

```
                      ┌───────────┐
                      │  pending  │  ← affiliate just created the lead
                      └─────┬─────┘
            affiliate       │       affiliate
            reject          │       confirm
            ┌───────────────┼──────────────┐
            ▼               │              ▼
      ┌──────────┐          │        ┌──────────┐
      │cancelled │          │        │confirmed │  stock decremented
      └──────────┘          │        └─────┬────┘
                            │              │
                            │              │ merchant: shipOrder
                            │              ▼
                            │        ┌──────────┐
                            │        │ shipped  │  ECOTRACK created
                            │        └─────┬────┘
                            │              │
                            │              │ ECOTRACK: en_livraison /
                            │              │           dispatched_to_driver
                            │              ▼
                            │        ┌──────────┐
                            │        │at_wilaya │
                            │        └─────┬────┘
                            │              │ ECOTRACK: livred
                            │              ▼
                            │        ┌──────────┐
                            │        │delivered │ → settleOrderTx
                            │        └──────────┘
                            │
                            ▼
                       ┌──────────┐
                       │ disputed │  ← admin or system flag on conflict
                       └─────┬────┘
                             │ admin resolution
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        delivered        returned        cancelled
        (settles)     (refusal rate↑)  (no effect)

  Returned path (from ECOTRACK):  shipped/at_wilaya → returned
                                  (recompute refusal_rate)
```

### 8.3 Data Flow Diagram (high-level)

```
  ┌─────────────┐    HTTPS    ┌────────────────────────┐    SQL    ┌──────────────┐
  │   Browser   │────────────►│  TanStack Start App    │──────────►│  PostgreSQL  │
  │  (React 19) │◄────────────│  (SSR + RPC + cron)    │◄──────────│   (Drizzle)  │
  └─────────────┘    JSON     └────────┬───────────────┘   types   └──────────────┘
                                       │
                                       │ HTTPS  (?api_token=…)
                                       ▼
                              ┌────────────────────────┐
                              │  platform.dhd-dz.com   │
                              │   (ECOTRACK / DHD)     │
                              └────────────────────────┘
                                       ▲
                                       │ POST /api/cron/sync-tracking
                                       │ x-cron-secret: …
                              ┌────────┴───────────────┐
                              │  External scheduler    │
                              │  (Vercel Cron / GH     │
                              │   Actions / crontab)   │
                              └────────────────────────┘
```

---

## PART 9 — IMPLEMENTATION CHAPTER DRAFT (Master's-thesis prose)

### 9.1 Technology Stack & Justification

The implementation rests on a **TypeScript-end-to-end stack**. Each layer was chosen against a concrete constraint of the problem domain.

**Runtime — Node.js (server) + the browser (client).** A unified language across the stack is more than convenience: it allows the system to share Zod schemas between the request validator and the client form, eliminating an entire class of contract-drift bugs that plague REST architectures.

**Application framework — TanStack Start (Vite + React 19 + TanStack Router).** Three properties drove the choice. First, *file-based routing with auto-generated type-safe links*: the router knows every route at compile time, so navigation errors surface as TypeScript errors. Second, *server functions* (`createServerFn`): every privileged operation is a typed function the client imports as if local, with input validation guaranteed server-side. The contract becomes the type itself. Third, *first-class SSR*: the dashboard data loaders run on the server during the initial request, presenting a hydrated UI without a client-only loading flash — important for an Algerian audience often on intermittent connectivity.

**Persistence — PostgreSQL with Drizzle ORM.** PostgreSQL is the only realistic candidate for the settlement workflow because the implementation relies on (a) row-level `FOR UPDATE` locks, (b) partial unique indexes that depend on a `WHERE` predicate (e.g. one default delivery account per provider *for non-deleted rows*), (c) `CHECK` constraints on monetary fields, and (d) typed `pg_enum` for the eight-state order machine. Drizzle was preferred over Prisma because settlement code uses raw `sql\`…\`` templated expressions for things like aggregate refusal-rate recomputation — Drizzle keeps SQL as first-class output.

**Authentication — better-auth.** Rather than rolling a JWT implementation, the project adopts better-auth because the magic-link plugin matches the invitation workflow exactly, the rate limiter ships preconfigured per endpoint, and the Drizzle adapter shares the project's type system. The `databaseHooks` system is the chosen extension point for the role-clamp security control.

**UI — React 19 + Tailwind CSS v4 + shadcn/ui (new-york).** Tailwind v4's compile-time engine yields the small bundles that an Algerian user base — often on mobile data — needs. shadcn/ui copies components into the project rather than installing them as a package, eliminating the supply-chain risk of an upstream styling change breaking the admin console.

**Carrier integration — bespoke `EcotrackService`.** ECOTRACK has no published TypeScript SDK. The service class encapsulates the carrier's quirks (query-string `api_token` rather than `Authorization` header, manual redirect-following so POSTs don't degrade to GETs, parsing of 422 validation envelopes from Laravel, exponential-back-off retry on 5xx but not 4xx).

### 9.2 System Architecture (Implementation Details)

The system is implemented as a **modular monolith with a hexagonal core**. The application is a single deployable unit, but its internals separate *delivery layer* (TanStack routes), *application layer* (server functions in `-server/<feature>.api.ts`), *domain layer* (`src/server/settlement*.ts`, `src/server/delivery/*`), and *infrastructure adapters* (`src/server/services/ecotrack.service.ts`, `src/server/storage.ts`).

The four-layer separation is observable, not just aspirational. The pure functions `computeSettlement` and `decideShipClaim` are unit-tested in isolation (`settlement-math.test.ts`, `label.test.ts`), confirming that the domain logic carries no implicit dependency on the database or the network. The infrastructure adapters are likewise pluggable: switching object storage from local disk to S3/Cloudflare R2 requires modifying `src/server/storage.ts` only; no route or business code references the filesystem directly.

### 9.3 Database Design (Rationale)

The schema design optimises for three pressures: **money safety, idempotent integration, and privacy minimisation**.

For *money safety*, every monetary value is an integer column (DZD), every `CHECK (≥ 0)` is enforced at the database level, and the wallet table carries two columns — `available_balance_dzd` and `pending_balance_dzd` — so funds in escrow are physically separated from withdrawable funds. The `transactions` table is append-only with a `related_txn_id` self-reference, enabling future refund chains without schema migration.

For *idempotent integration*, the schema deploys several **partial unique indexes** as concurrency primitives:
- `idx_orders_internal_shipment` on `internal_shipment_id WHERE NOT NULL` — supports the atomic ship-claim pattern.
- `idx_orders_external_unique` on `(external_source, external_order_id) WHERE external_order_id IS NOT NULL` — blocks duplicate ingestion from a hypothetical browser-extension importer.
- `idx_tracking_events_unique` on `(order_id, status, occurred_at)` — guarantees an ECOTRACK event applied twice is recorded once.

For *privacy minimisation*, customer PII is concentrated in five columns of `orders` (`customer_name`, `customer_phone`, `customer_wilaya_code`, `customer_commune`, `customer_address`, `customer_note`). The companion `toMerchantOrderView` sanitisation function lives in `src/server/privacy/order-views.ts`, geographically separated from any route, marking the privacy boundary explicit.

### 9.4 Security Implementation

The security model is best described as **stratified**: each operation passes through up to four enforcement points, each independently sufficient.

The *first stratum* is the **route guard**: `_dashboard.tsx`, `merchant.tsx`, and `affiliate.tsx` each declare a `beforeLoad` that runs server-side, reads `context.session`, and either passes or redirects. A user whose `role` does not match the layout's expected value is redirected to `/login` before any feature data is queried.

The *second stratum* is the **server-function guard**. Because route guards can be circumvented by direct RPC calls, every handler reasserts the session through `requireSuperAdmin`, `requireMerchant`, or `requireAffiliate`. These helpers, defined in `src/server/auth/guards.ts`, are the system's *single point of authorisation drift control*: a future developer adding a new server function cannot accidentally invent a per-file copy of the role check.

The *third stratum* is the **query scope**: every `WHERE` clause binds to the caller's profile id (`eq(orders.merchant_id, profileId)`), so even a bypassed guard would yield zero rows.

The *fourth stratum* is the **privacy sanitisation layer**: for the merchant view of orders, results pass through `toMerchantOrderView`, which reconstructs each row without copying customer PII fields. The protection is defensive — even if a future query accidentally selects a PII column, it cannot leak.

In addition to RBAC, the system defends against three specific attacks. A *role-elevation attack* via the public sign-up endpoint is mitigated by the `databaseHooks.user.create.before` clamp: any role other than `merchant` collapses to `affiliate`, and `status` is forced to `pending`. A *label-forgery attack* is mitigated by the HMAC-SHA256 token (72-hour TTL, single-use enforcement via `label_token_used_at`, constant-time signature comparison via `timingSafeEqual`, and an immutable audit log in `label_print_audit`). A *cron-secret-guess attack* is mitigated by the constant-time secret compare in `src/server/cron.ts`, with the endpoint failing closed (503) when the environment variable is unset.

### 9.5 API Communication

The system uses three distinct communication channels:

1. **Internal RPC** between client React components and server-side handlers, via `createServerFn`. The transport is HTTPS POST with a JSON envelope, but the developer interacts with it as a typed asynchronous function. Input validation is mandatory: every mutation passes a Zod schema before any handler logic runs.

2. **External REST** with ECOTRACK, encapsulated in `EcotrackService`. The call surface is intentionally narrow: `validateToken`, `getWilayas`, `getCommunes`, `getFees`, `createOrder`, `updateOrder`, `deleteOrder`, `shipOrder`, `requestReturn`, `addTrackingNote`, `getTrackingInfo`, `getOrders`, `getLabel`. The service enforces an exponential-back-off retry (250 ms × 2^n + jitter) on 5xx responses and explicitly *does not* retry 4xx or business-logic errors, which would otherwise mask validation problems behind silent retries.

3. **Cron triggers**, exposed as protected POST endpoints (`/api/cron/sync-tracking`, `/api/cron/release-funds`, `/api/cron/sync-catalog`) and invoked by an external scheduler. The contract is intentionally one-way: the scheduler does not receive structured responses, just `{ ok: true, … }` for observability. The endpoints are idempotent — re-firing one of them is safe — which decouples scheduler reliability from system correctness.

### 9.6 Implementation Highlights (selected, thesis-worthy)

**The ship-claim pattern.** The merchant's "Ship" button must (a) not double-ship on rapid clicks, (b) not double-ship when two browser tabs race, (c) not double-ship when a partial failure leaves a stranded `internal_shipment_id` from a previous attempt, and (d) be self-recovering. The implementation in `decideShipClaim` (a pure function tested independently) defines a five-way decision based on `(status, trackingNumber, internalShipmentId, qrToken)` and the age of the `qrToken`'s issued-at timestamp. Crucially, the `qrToken` already carries a signed timestamp — so the age check needs no additional column, and no schema migration is required to distinguish "another tab is shipping right now" from "a previous attempt died". The pattern is a teachable example of **trusting your own cryptographic tokens to do double duty as state metadata**.

**Forward-only status advance.** `applyEcotrackEvent` maintains a `RANK` map and refuses to advance status backwards. This guards against out-of-order webhook delivery — a common production failure mode — and is the reason returned orders use a "same-rank" exception (`returned` and `delivered` share rank 4) so a returned event can over-write a delivered one but not vice versa.

**Atomic admin override on catalog sync.** Most "sync with override" implementations read the override flag, then write the new value, opening a race in which an override is toggled mid-sync. This implementation uses a single SQL `UPSERT` with a `CASE WHEN admin_override THEN current ELSE new END` clause — the protection is *inside* the same statement that updates the row, making it impossible to miss.

---

## PART 10 — UML GENERATION GUIDE

This section is a *guide for producing UML diagrams*, not the diagrams themselves; it lists exactly which classes / actors / states should be drawn and where the source-of-truth for each lives in the codebase.

### 10.1 Use-Case Diagram

**Actors:** Customer (external, not a system user), Affiliate, Merchant, Super Admin, ECOTRACK Carrier (external system), Scheduler (external system).

**Use cases to include** (group by actor):

- *Affiliate*: Register, Browse marketplace, Generate tracking link, Create manual lead, Confirm/Reject order, View commission, Request withdrawal, Receive notification.
- *Merchant*: Accept invitation, Add/edit product, View confirmed orders, Ship order, Print internal label, Request return (within 48h), Request withdrawal.
- *Super Admin*: Approve join requests, Send warnings, Suspend/delete users, Manage delivery accounts, Sync delivery catalog, Approve/reject/confirm withdrawal, Resolve dispute, Print official ECOTRACK label, Edit settings.
- *Scheduler*: Trigger sync-tracking, Trigger release-funds, Trigger sync-catalog.
- *ECOTRACK*: Provide wilayas/communes/fees, Accept create_order, Provide tracking_info, Provide official label PDF.

### 10.2 Class Diagram

Use the schema's table classes as the entities. Key associations:

```
User ─1─1─ MerchantProfile / AffiliateProfile / Wallet
User ─1─N─ Notification, WithdrawalRequest, Session, Account
MerchantProfile ─1─N─ Product
Product ─1─N─ TrackingLink, Order
AffiliateProfile ─1─N─ TrackingLink, Order
Order ─1─N─ OrderStatusHistory, OrderTrackingEvent, LabelPrintAudit
Order ─N─1─ DeliveryAccount, DeliveryOffice, TrackingLink
Wallet ─1─N─ Transaction
Transaction ─N─0..1─ Order, Transaction (related_txn_id self-ref)
DeliveryPricing (per-wilaya; no FK from Order — looked up by code)
Setting (global key-value)
```

Domain services (not tables — model as classes with stereotypes):

- `<<service>> EcotrackService` — public methods listed in §9.5.
- `<<service>> PayoutService` — `processPayout(orderId)`.
- `<<service>> SettlementEngine` — `settleOrderTx`, `releaseMaturedFundsTx`, `recomputeRefusalRateTx`, `flagOrderDisputedTx`, `resolveDisputeTx`.
- `<<service>> LabelTokenService` — `issueLabelToken`, `verifyLabelToken`, `decideShipClaim`.
- `<<service>> CatalogSync` — `syncDeliveryCatalog`.
- `<<service>> EcotrackSync` — `applyEcotrackEvent`, `syncOrderTracking`, `syncAllActiveOrders`.
- `<<service>> AuthGuards` — `requireSession`, `requireSuperAdmin`, `requireMerchant`, `requireAffiliate`.
- `<<service>> NotificationService` — `notify`, `notifyMany`, `notifySuperAdmins`.
- `<<service>> PrivacyView` — `toMerchantOrderView`.

### 10.3 State-Machine Diagram (Order)

Draw the eight states of `order_status_enum` as nodes, with transitions:

```
pending  ──affiliate.confirm──►  confirmed
pending  ──affiliate.reject──►  cancelled
confirmed  ──merchant.ship──►  shipped
shipped  ──ECOTRACK.dispatch──►  at_wilaya
shipped  ──ECOTRACK.return──►  returned
at_wilaya  ──ECOTRACK.livred──►  delivered
at_wilaya  ──ECOTRACK.return──►  returned
any active  ──conflict──►  disputed
disputed  ──admin.resolve(delivered)──►  delivered
disputed  ──admin.resolve(returned)──►  returned
disputed  ──admin.resolve(cancelled)──►  cancelled
```

Annotate the `delivered` transition with `/ settleOrderTx; recomputeRefusalRateTx` and the `returned` transition with `/ recomputeRefusalRateTx`.

### 10.4 Sequence Diagrams (recommend three)

**SD-1: Affiliate creates manual lead and confirms it.** Actors: Affiliate, Browser, Server-Function `addLeadManual`, Server-Function `confirmLead`, DB, NotificationService. Show the `FOR UPDATE` lock around stock decrement.

**SD-2: Merchant ships an order.** Actors: Merchant, Browser, `shipOrder`, DB, `EcotrackService.createOrder`, ECOTRACK platform. Highlight the three phases (claim, external call, finalize) and the rollback path on failure.

**SD-3: Cron syncs tracking and triggers settlement.** Actors: Scheduler, `/api/cron/sync-tracking`, `syncAllActiveOrders`, `EcotrackService.getTrackingInfo`, `applyEcotrackEvent`, `processPayout`, `settleOrderTx`, DB, NotificationService. Highlight the per-order back-off update on failure.

### 10.5 Component Diagram

Three logical components:

- **Web App** (TanStack Start, single deployable). Sub-components: Auth, Routing, Server Functions, Domain Services, Adapters.
- **PostgreSQL** (single database). Schemas: identity, catalogue, orders, money, delivery, audit, notifications.
- **ECOTRACK** (external SaaS).

Interfaces: `<<HTTPS/RPC>>` between Browser and Web App, `<<SQL/postgres>>` between Web App and PostgreSQL, `<<HTTPS/REST>>` between Web App and ECOTRACK, `<<HTTPS/cron>>` between Scheduler and Web App.

### 10.6 Deployment Diagram (suggested)

Three nodes:

1. **Application node** — runs `vite preview` or the compiled SSR bundle. Environment: `DATABASE_URL`, `RESEND_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `VITE_APP_URL`, `LABEL_HMAC_SECRET`, `CRON_SECRET`, `API_DHD`, `ECOTRACK_BASE_URL`, `STORAGE_DRIVER`, `NODE_ENV`.
2. **Database node** — managed PostgreSQL (Neon / Supabase / RDS).
3. **Scheduler node** — Vercel Cron (recommended) or GitHub Actions. Triggers POSTs to `/api/cron/*` with `x-cron-secret` header.

---

## SUMMARY OF FINDINGS

- **Project scope**: a production-grade three-sided affiliate/dropshipping platform tailored to Algerian COD commerce, with first-class carrier integration (ECOTRACK/DHD).
- **Code organisation**: TanStack-Start file-based routes + Drizzle schema as the source of truth; the convention is *route folder = feature folder*, isolating one feature per directory.
- **Strongest areas**: financial workflow (idempotent settlement, two-phase escrow with hold + release, withdrawal state machine with concurrency guards), security stratification (role clamp + HMAC label tokens + constant-time secret compares + privacy sanitisation), carrier integration robustness (pull model with per-order back-off and forward-only state machine).
- **Reverse-engineered weaknesses worth noting in the thesis discussion**: the public `/p/<slug>` funnel is wired in the data model (tracking links + click_count) but not implemented as a route; the order workflow currently supports manual leads only. No event bus — adding cross-feature side effects is a manual code change. Cron is externally driven, so deployment must include scheduling configuration explicitly.
- **Recommended future improvements** (for the thesis's "Perspectives" chapter): (1) implement the `/p/<slug>` public landing + checkout flow; (2) introduce a typed event bus (`emit('order.delivered', …)`) to decouple settlement from notifications; (3) add a durable job queue (BullMQ / pg-boss) for retrying failed notifications; (4) extend carrier support to ZR Express / Yalidine; (5) add an end-to-end audit-log table aggregating order_status_history + label_print_audit + transactions under a single timeline.
