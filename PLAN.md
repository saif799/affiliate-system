# DzDrop — Delivery / Shipping Hardening Plan

> **Status:** Planning only. No source file has been modified. Await `BEGIN PHASE 1`.
> **Scope:** Audit + extend the existing order/delivery subsystem. The ECOTRACK
> integration already works — we audit and extend it, never rebuild it.
> **Hard constraints honored throughout:**
> - ECOTRACK has **no webhooks** → all sync is **polling** (cron + manual).
> - Wilaya/office/pricing data is always **fetched from ECOTRACK and cached
>   locally**, never hardcoded. Order forms read the **local cache only**.

---

## 0. How to read this plan

- The task brief labels this "7 phases" but enumerates **8** (Phase 8 = Risk
  Register). All 8 are delivered, in dependency order. Do not reorder.
- Every `[ASSUMPTION]` is a decision I made where the brief and the real codebase
  disagree, or where a business rule is undefined. **Verify each before its phase.**
- File paths use the repo's `#/*` = `src/*` alias. `src/routeTree.gen.ts` is
  auto-generated and is never edited by hand.
- Migrations are produced with `npx drizzle-kit generate` **after** editing
  `src/server/db/schema.ts`; the next sequence number is **0006** (latest on disk
  is `drizzle/0005_*`). "DB migrations needed" lists the logical migrations.

### 0.1 Baseline established by the audit (ground truth)

| Area | Reality in code today |
|------|----------------------|
| Order lifecycle | `pending → confirmed → shipped → at_wilaya → delivered/returned`; plus `cancelled`, `disputed`. **Affiliate** confirms (`pending→confirmed`, decrements stock); **Merchant** ships (`confirmed→shipped`, creates the ECOTRACK shipment). Post-ship statuses come **only** from polling. |
| Status enum | `orderStatusEnum` in `schema.ts` — **no `shipping_in_progress`**. |
| Idempotency for imports | **Already present**: `orders.external_source` + `orders.external_order_id` + partial unique index `idx_orders_external_unique … WHERE external_order_id IS NOT NULL`. |
| Delivery columns present | `customer_wilaya_code`, `customer_commune`, `customer_address`, `customer_note`, `tracking_number`, `ecotrack_account_id`, `delivery_status`, `shipping_fee_dzd` (declared, **never written**, stays 0). |
| Delivery columns missing | `delivery_type`, office reference, a *used* delivery price, `internal_shipment_id`, `qr_token`, `label_printed_at`, poll-throttle fields. |
| Tables missing | `delivery_pricing`, `delivery_offices`, label audit. No `order_items` (orders are single-product + `quantity`). |
| ECOTRACK office model | **No office/desk registry and no `office_id`.** "Office pickup" = a `commune` with `has_stop_desk = 1` (from `get/communes`) + `stop_desk = 1` on `create/order`. `get/fees` returns `tarif` (home) + `tarif_stopdesk` (office) per `wilaya_id`. |
| Polling | `src/routes/api/cron/sync-tracking.ts` (POST, `x-cron-secret`, ~15 min) → `syncAllActiveOrders()`. |
| Webhook | **A webhook route exists** (`src/routes/api/webhooks/ecotrack.ts`, gated by `ECOTRACK_WEBHOOK_SECRET`) — contradicts "polling only". Flagged for disable/removal. |
| Label | `EcotrackService.getLabel()` exists but is **wired to no route/UI**. |
| Auth | `requireSuperAdmin` / `requireMerchant` / `requireAffiliate` are **duplicated per-file**; no central guard module; no PII sanitizer layer. |

---

## PHASE 1 — Schema & Database Audit

### 1.1 Audit of existing order tables

**`orders`** (`src/server/db/schema.ts:293`) — single-product order (no `order_items`).
Present & correct: identity FKs (`product_id`, `affiliate_id` nullable, `merchant_id`,
`tracking_link_id`), full customer block, pricing block, fee block, status, lifecycle
timestamps, ECOTRACK block (`ecotrack_account_id`, `delivery_status`, `tracking_number`),
external-import block, soft-delete absent (orders are not soft-deleted — intentional).

**`order_status_history`** (`schema.ts:372`) — audit log: `from_status`, `to_status`,
`occurred_at`, `source`, `note`. Already written on confirm/reject/ship/dispute/resolve.

**`order_tracking_events`** (`schema.ts:426`) — local archive of ECOTRACK activity with
idempotency unique index `(order_id, status, occurred_at)`.

**`delivery_accounts`** (`schema.ts:395`) — multi-account ECOTRACK creds, partial unique
"one default per provider".

### 1.2 Missing fields on `orders` (to add)

| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| `delivery_type` | `delivery_type` enum (`home` \| `office`) | Phase 6 selection | new `pgEnum`; default `home` for backfill |
| `delivery_office_id` | `uuid` FK → `delivery_offices.id` (nullable) | office pickup target | `[ASSUMPTION]` see 1.5 — this is an **internal** id, never sent to ECOTRACK |
| `delivery_price_dzd` | `integer` not null default 0 | the price shown to affiliate & stored as snapshot | **reuse existing `shipping_fee_dzd`** instead of a new column — see 1.6 |
| `internal_shipment_id` | `text` unique (nullable until shipped) | human-readable internal ref (e.g. `SHP-3F9A12`) | Phase 5 |
| `qr_token` | `text` (nullable) | HMAC token encoded in the QR on the internal label | Phase 5; not the raw order id |
| `label_printed_at` | `timestamp` (nullable) | set when Super Admin prints official label | Phase 5 |
| `label_token_used_at` | `timestamp` (nullable) | one-time-use enforcement (atomic claim) | Phase 5 |
| `delivery_polled_at` | `timestamp` (nullable) | poll throttle (TTL) | Phase 3 |
| `delivery_poll_failures` | `integer` not null default 0 | backoff/circuit-break per order | Phase 3 |
| `delivery_next_poll_at` | `timestamp` (nullable) | exponential per-order cooldown | Phase 3 |

`[ASSUMPTION 1.a]` We do **not** add `shipping_in_progress` to `order_status`. Instead we
prevent the ship race with a row lock + idempotency key (Phase 4). Rationale: ALTER TYPE …
ADD VALUE cannot run inside the same transaction that uses it, complicates the enum, and
the lock approach is simpler and already the pattern used in `settleOrderTx`. **If you want
a visible intermediate state**, say so and we add the enum value as migration 0006a.

### 1.3 `delivery_pricing` table (new)

```
delivery_pricing
  id              uuid pk default random
  wilaya_id       integer not null            -- ECOTRACK wilaya_id (1..58)
  wilaya_name     text    not null            -- from get/wilayas
  home_price_dzd  integer not null            -- from get/fees .tarif
  office_price_dzd integer not null           -- from get/fees .tarif_stopdesk
  admin_override  boolean not null default false
  last_synced_at  timestamp not null default now()
  updated_at      timestamp not null default now() ($onUpdate)
  UNIQUE (wilaya_id)
  CHECK (home_price_dzd >= 0 AND office_price_dzd >= 0)
```

`[ASSUMPTION 1.b]` `office_price_dzd` is `NOT NULL`; if ECOTRACK returns no
`tarif_stopdesk` for a wilaya we store it equal to `home_price_dzd` and the UI hides the
office option for wilayas with no stop-desk communes.

### 1.4 `delivery_offices` table (new) — sourced from stop-desk communes

> **Critical correction to the brief.** ECOTRACK exposes **no** office/desk list and
> **no `office_id`**. The real unit is a `commune` with `has_stop_desk = 1`. So
> `delivery_offices` is populated from `get/communes` (where `has_stop_desk = 1`), and
> `create/order` continues to receive `commune` + `code_wilaya` + `stop_desk`, **never**
> an office id. `delivery_office_id` on `orders` is an internal pointer for UI/reporting.

```
delivery_offices
  id              uuid pk default random
  wilaya_id       integer not null            -- ECOTRACK wilaya_id
  office_code     text    not null            -- synthetic stable key: `${wilaya_id}:${commune}`
  name            text    not null            -- commune name (the stop-desk location)
  address         text                        -- code_postal / null (ECOTRACK gives no street)
  has_stop_desk   boolean not null default true
  last_synced_at  timestamp not null default now()
  UNIQUE (wilaya_id, office_code)
  INDEX (wilaya_id)
  FK wilaya_id is logical (mirrors delivery_pricing.wilaya_id); no hard FK to avoid
     sync-order coupling — see 1.7
```

`[ASSUMPTION 1.c]` `office_code = "${wilaya_id}:${communeName}"`. `address` holds
`code_postal` because ECOTRACK provides no street address for a desk.

### 1.5 FKs, cascades, indexes, enums to change

- **New enum:** `delivery_type` (`home`,`office`).
- **New FK:** `orders.delivery_office_id → delivery_offices.id` (`ON DELETE SET NULL` — a
  desk disappearing from ECOTRACK must not delete orders).
- **No hard FK** `delivery_offices.wilaya_id → delivery_pricing.wilaya_id`: both are
  synced independently; a logical link + app validation avoids a sync ordering deadlock.
- **New indexes:** `idx_orders_internal_shipment` (unique, partial `WHERE
  internal_shipment_id IS NOT NULL`); `idx_orders_label_pending` on
  `(status, label_printed_at)` for the Phase 5 dashboard; `idx_orders_poll` on
  `(status, delivery_next_poll_at)` for Phase 3 polling selection.
- **`delivery_pricing`:** unique `(wilaya_id)`. **`delivery_offices`:** unique
  `(wilaya_id, office_code)` + index `(wilaya_id)`.
- **No change** to existing `idx_orders_external_unique` (already correct for Phase 7).

### 1.6 Reuse decision — delivery price column

`orders.shipping_fee_dzd` already exists (integer, default 0, currently never written).
**Reuse it as the stored delivery price** rather than adding `delivery_price_dzd`. One
column, one meaning. `[ASSUMPTION 1.d]` Stored delivery price is a **display/reporting
snapshot** from `delivery_pricing` at order time; the COD `montant` sent to ECOTRACK stays
= sale price × qty (ECOTRACK computes its own carrier fee). Confirm whether delivery cost
should be **added to** COD `montant` — that is a business rule, not visible in code.

### 1.7 New `label_print_audit` table (Phase 5 anti-fraud)

```
label_print_audit
  id            uuid pk default random
  order_id      uuid not null FK → orders.id ON DELETE CASCADE
  actor_user_id text not null FK → users.id
  action        text not null      -- 'print_attempt'
  result        text not null      -- 'success' | 'invalid_signature' | 'expired' | 'already_used' | 'ecotrack_error'
  detail        text
  created_at    timestamp not null default now()
  INDEX (order_id), INDEX (created_at)
```

### 1.8 Race conditions in concurrent status updates (audit result)

| # | Path | Safe today? | Finding |
|---|------|-------------|---------|
| R1 | `shipOrder` (merchant) | ❌ **No** | No `.for('update')`; reads status, calls ECOTRACK, writes — two concurrent calls both pass the `confirmed` guard ⇒ **two ECOTRACK shipments**. `existingTracking` is selected but never checked. No idempotency key. **Fixed in Phase 4.** |
| R2 | `applyEcotrackEvent` (poll/sync) | ✅ Yes | Row-locks order `for('update')`, forward-only rank, idempotent event insert. |
| R3 | `settleOrderTx` | ✅ Yes | Row-locks, idempotent via `settled_at`. |
| R4 | `confirmLead` | ✅ Yes | Locks product row before stock decrement. |
| R5 | pricing sync vs admin edit | ⚠️ N/A yet | New in Phase 5 — must not overwrite `admin_override = true` rows; do sync in a transaction. |

### 1.9 Migration steps (schema only)

1. **0006_delivery_catalog** — create `delivery_pricing`, `delivery_offices`.
2. **0007_order_delivery_fields** — `delivery_type` enum; add `orders` columns
   (`delivery_type` default `home`, `delivery_office_id` FK, poll fields); reuse
   `shipping_fee_dzd`. Backfill existing rows: `delivery_type='home'`.
3. **0008_label_system** — add `orders` label columns + indexes; create
   `label_print_audit`.

(Each = edit `schema.ts` → `npx drizzle-kit generate` → review SQL → `migrate`.)

### 1.10 Files
- **Modify:** `src/server/db/schema.ts`.
- **Create (generated):** `drizzle/0006_*`, `drizzle/0007_*`, `drizzle/0008_*` (+ meta snapshots).

### 1.11 Success Criteria
- `npx drizzle-kit generate` produces 3 clean migrations; `migrate` applies on a copy of
  prod schema with **zero data loss** and all existing rows backfilled `delivery_type='home'`.
- `npm run build` + `tsc` pass with the new columns/types.
- All new tables/columns/indexes/enums from 1.2–1.7 exist; `idx_orders_external_unique`
  unchanged. A seed script can insert a `delivery_pricing` row and an `orders` row
  referencing a `delivery_offices` row without constraint errors.

---

## PHASE 2 — RBAC: Data Privacy by Role

### 2.1 Rules → required visibility

| Field | Affiliate | Merchant | Admin |
|-------|:---------:|:--------:|:-----:|
| customer name / phone / address / commune / note | ✅ | ❌ | ✅ |
| wilaya, order ref, product, quantity, status, delivery type, office name | ✅ | ✅ | ✅ |

### 2.2 PII leak points found **in code** (not assumed)

| # | Location | Leak | Fix |
|---|----------|------|-----|
| P1 | `src/routes/merchant/orders/-server/orders.api.ts` → `getMerchantOrders` (selects `customer_name`, `customer_phone`, `customer_commune`, `customer_address`, `customer_note`) | Sends full PII to merchant | Stop selecting PII; return sanitized shape (wilaya, ref, product, qty, delivery type, office name, status, tracking). |
| P2 | `src/routes/merchant/orders/-orders.types.ts` → `Order.customer{name,phone}`, `address`, `commune`, `note` | Type carries PII | Replace with PII-free `MerchantOrder` type. |
| P3 | `src/routes/merchant/orders/-components/OrdersTable.tsx:118-122` | Renders name + phone column | Replace "الزبون" column with order ref / delivery type. |
| P4 | `src/routes/merchant/orders/-components/OrderDetailsModal.tsx:87-97` | Renders name, phone, commune, address, note | Show wilaya + delivery type + office name only. |
| P5 | `src/routes/merchant/orders/index.tsx:58` | Client search filters on `customer.name` | Search by order ref / product only. |
| P6 | `shipOrder` server fn (same file) reads PII | **Server-only, allowed** (needed to call ECOTRACK). Not a leak — but PII must never be returned to the merchant client and never put on the internal label (Phase 5). Document as "server-only PII boundary". |

**Affiliate (`getAffiliateOrders`)** — correctly returns customer name + phone; brief
requires "all customer details + complete tracking history". **Gaps (MISSING, not leaks):**
list omits `address`/`commune`; tracking history is only in the (affiliate) details modal
via `getOrderTracking` (already role-checked ✅). Add address/commune to the affiliate
detail view in Phase 6.

**Admin (`getAdminOrders`)** — returns name + wilaya; admin may see all → not a leak.

### 2.3 Sanitization design

- **New module `src/server/privacy/order-views.ts`:**
  - `toMerchantOrderView(row)` → strips name/phone/address; keeps wilaya, `internal_shipment_id`/ref, product, qty, `delivery_type`, office name, status, tracking.
  - `toAffiliateOrderView(row)` / `toAdminOrderView(row)` → full.
  - One canonical place so no query re-leaks. Server functions select columns then pass
    through the matching view function; the merchant query simply **does not select** PII
    (defense in depth: even if selected, the view drops it).
- **New module `src/server/auth/guards.ts`:** extract the duplicated
  `requireSuperAdmin/Merchant/Affiliate` into one tested module (returns `{session,
  profileId}`). Refactor all `*-server/*.api.ts` to import it. Lower bug surface for authz.

`[ASSUMPTION 2.a]` "delivery office name" shown to the merchant is the stop-desk commune
name (per Phase 1) — it is **not** PII.

### 2.4 Files
- **Create:** `src/server/privacy/order-views.ts`, `src/server/auth/guards.ts`.
- **Modify (server):** `merchant/orders/-server/orders.api.ts`,
  `affiliate/orders/-server/orders.api.ts`, `_dashboard/orders/-server/orders.api.ts`
  (use guards + views); optionally all other `*-server/*.api.ts` for the guard refactor.
- **Modify (types):** `merchant/orders/-orders.types.ts`.
- **Modify (UI):** `merchant/orders/-components/OrdersTable.tsx`,
  `merchant/orders/-components/OrderDetailsModal.tsx`, `merchant/orders/index.tsx`.
- **DB migrations:** none.

### 2.5 Success Criteria
- Network inspection of the merchant Orders loader response contains **no** customer name,
  phone, address, commune, or note for any order (automated test asserting absent keys).
- Merchant UI renders wilaya + delivery type + office + status with no PII; merchant search
  still works on ref/product.
- Affiliate & admin views unchanged in capability; `getOrderTracking` ownership checks
  still pass for all three roles.
- A unit test feeds a full order row through `toMerchantOrderView` and asserts PII keys are
  `undefined`.

---

## PHASE 3 — ECOTRACK API Integration Audit (polling only)

> **Docs note:** the Postman page (`documenter.getpostman.com/view/14517169/Tz5je15g`) is a
> JS-rendered SPA and yields nothing to server-side fetch. The authoritative contract used
> here is the **live-verified** memory `reference-ecotrack-dhd-api` **plus the implemented
> client** `src/server/services/ecotrack.service.ts` (which the integration already proves
> against the real API).

### 3.1 Endpoint → use-case map (audit verdicts)

| ECOTRACK endpoint | Service method | Used for | Verdict |
|---|---|---|---|
| `GET validate/token` | `validateToken()` | account test | ✅ OK |
| `GET get/wilayas` | `getWilayas()` | wilaya selector | ⚠️ called **live from the order form** today (`getDeliveryZones`) — must move to local cache (Phase 6) + a sync job (3.4). |
| `GET get/communes?wilaya_id=` | `getCommunes()` | commune/stop-desk selector | ⚠️ same — live from form (`getDeliveryCommunes`) → cache. |
| `GET get/fees` | `getFees()` | per-wilaya pricing | ⚠️ only used in account "test"; **not** surfaced as pricing yet → cache into `delivery_pricing` (3.4). |
| `POST create/order` | `createOrder()` | merchant ship | ⚠️ works, but hardcodes `type=1, stop_desk=0` (always home) and passes **no `reference`** idempotency key. Fix in Phase 4 + 6 (pass `stop_desk` from `delivery_type`, `reference = order.id`). |
| `POST valid/order` | `shipOrder()` | "Expedier" | ✅ available; **not currently called** (we create + rely on carrier). `[ASSUMPTION 3.a]` create/order is sufficient; valid/order optional. Confirm if DHD requires explicit validate. |
| `DELETE delete/order` | `deleteOrder()` | cancel pre-ship | ✅ available; wire to admin cancel (optional, Risk register). |
| `POST ask/for/order/return` | `requestReturn()` | merchant return | ✅ used in `tracking.api.ts` (48h window, note attached). |
| `POST add/maj` | `addTrackingNote()` | return reason | ✅ used. |
| `GET get/tracking/info?tracking=` | `getTrackingInfo()` | **polling source of truth** | ✅ used by sync; improve throttle/backoff (3.3). |
| `GET get/orders` | `getOrders()` | bulk reconcile | ✅ available; not scheduled. Optional nightly reconcile (Risk register). |
| `GET get/order/label?tracking=` | `getLabel()` | official label PDF | ⚠️ **implemented but wired to nothing** → Phase 5. |

### 3.2 Status mapping completeness

`ECOTRACK_TO_PLATFORM` in `ecotrack-sync.ts` covers **both** activity codes and
order-level statuses, with Arabic labels in `ecotrack.service.ts`. Forward-only `RANK`
prevents regressions; `suspendu`/`annule`/return-in-transit correctly map to `null`
(no auto change). **Verdict: complete.** Add a guard test asserting every key in
`ECOTRACK_STATUS_LABELS` has an entry (or explicit `null`) in `ECOTRACK_TO_PLATFORM` so
new carrier codes can't silently fall through.

### 3.3 Polling strategy (no webhooks)

- **Source of truth:** `api/cron/sync-tracking.ts` every ~15 min (existing) →
  `syncAllActiveOrders()`.
- **TTL / throttle (new):** select active orders where `delivery_next_poll_at IS NULL OR
  delivery_next_poll_at <= now()`. On success set `delivery_polled_at=now()`,
  `delivery_poll_failures=0`, `delivery_next_poll_at = now() + 15m`.
- **Exponential backoff (per order, new):** on failure increment
  `delivery_poll_failures`, set `delivery_next_poll_at = now() + min(15m * 2^failures,
  24h)`. After e.g. 8 consecutive failures, drop to once-daily ("circuit-break") and
  surface in the admin dashboard. Prevents hammering dead tracking numbers.
- **Transport backoff (improve service):** `EcotrackService.request` retries only 5xx/network
  with **linear** `200*(attempt+1)`. Change to **exponential + jitter**
  (`base * 2^attempt + rand`) and keep "no retry on business/4xx". Keep `maxRetries=2`.
- **Stale-while-revalidate (order detail):** detail pages render cached
  `order_tracking_events` immediately (already do). If `delivery_polled_at` older than TTL,
  fire a non-blocking `syncOrderTracking(orderId)` and let the next load show fresh data.
  Manual "sync now" stays (`syncOrderWithEcotrack`, admin).
- **Pricing/catalog TTL:** `delivery_pricing.last_synced_at` / `delivery_offices.last_synced_at`;
  resync daily via cron + on-demand button. Prices change rarely → 24h TTL acceptable.

### 3.4 Catalog + pricing sync (new) — feeds Phases 5 & 6

- **New module `src/server/delivery/catalog-sync.ts`:**
  - `syncDeliveryCatalog(accountId?)`: `getWilayas()` + `getFees()` →
    upsert `delivery_pricing` (skip rows with `admin_override=true` unless `force`);
    `getCommunes(wilaya)` per wilaya → upsert `delivery_offices` where `has_stop_desk=1`.
    All in a transaction; set `last_synced_at`.
- **New cron `src/routes/api/cron/sync-catalog.ts`** (daily, `x-cron-secret`).

### 3.5 Webhook constraint reconciliation
`src/routes/api/webhooks/ecotrack.ts` exists and violates "polling only". It is already
**disabled unless `ECOTRACK_WEBHOOK_SECRET` is set**. **Plan:** delete the route (and the
"webhook" comments in `settlement.ts`/`ecotrack-sync.ts`) OR leave it disabled and
documented as out-of-scope. `applyEcotrackEvent` stays generic (good design); only the HTTP
entrypoint is removed. `[ASSUMPTION 3.b]` We **remove** the route to satisfy the constraint
unequivocally.

### 3.6 Files
- **Modify:** `src/server/services/ecotrack.service.ts` (backoff), `src/server/delivery/ecotrack-sync.ts` (TTL/backoff in `syncAllActiveOrders`).
- **Create:** `src/server/delivery/catalog-sync.ts`, `src/routes/api/cron/sync-catalog.ts`.
- **Remove (3.b):** `src/routes/api/webhooks/ecotrack.ts`.
- **DB migrations:** none new (uses Phase 1 poll fields + tables).

### 3.7 Success Criteria
- A unit/integration test simulates 3 consecutive `getTrackingInfo` failures and asserts
  `delivery_next_poll_at` grows exponentially and resets on success.
- `syncDeliveryCatalog` populates `delivery_pricing` (58 wilayas) and `delivery_offices`
  (only stop-desk communes); a second run does not overwrite an `admin_override=true` row.
- No code path references a webhook; grep for `webhook` returns only historical comments
  (or nothing if removed). Polling remains the sole status source.
- Status-map guard test passes (every label has a platform mapping).

---

## PHASE 4 — Shipping Confirmation Flow (race-safe)

### 4.1 Corrected flow (adapted to this codebase)

> `[ASSUMPTION 4.a]` The brief says "validate state = pending". In DzDrop the merchant ships
> a **`confirmed`** order (affiliate already moved `pending→confirmed`). The flow below uses
> `confirmed` as the valid precondition. Confirm before coding.

1. Merchant clicks **Ship** → button disabled immediately (`isUpdating` lock already exists
   in `merchant/orders/index.tsx`); add per-row disabling so other rows stay usable.
2. **Confirmation modal** (new) shows order summary incl. `delivery_type` + office name (if
   office). Currently there is **no** confirm modal — ship fires directly. Add it.
3. Confirm → `shipOrder` server fn.
4. **Server validation (in a transaction, with row lock):**
   `SELECT … FROM orders WHERE id=? AND merchant_id=? FOR UPDATE`; assert
   `status='confirmed'`, `tracking_number IS NULL`, wilaya/commune present.
5. **Idempotency / duplicate prevention:** pass `reference = order.id` to
   `createOrder` (ECOTRACK dedups on reference); also the `tracking_number IS NULL` guard
   under the row lock makes a second concurrent/refresh click a no-op (returns existing
   tracking). This removes race **R1**.
6. Call `createOrder({ …, stop_desk: delivery_type==='office'?1:0, type:1,
   reference: order.id })` → `tracking`.
7. On success: `UPDATE orders SET status='shipped', shipped_at=now,
   tracking_number=?, ecotrack_account_id=?, internal_shipment_id=?, qr_token=?` +
   `order_status_history` row (`source='merchant'`).
8. On ECOTRACK failure: transaction rolls back → order stays `confirmed`; surface the
   `EcotrackApiError.message` (Arabic) to the merchant. (No partial writes.)
9. Notify Super Admin: "shipment ready to print" (`notify`, link `/super-admin/shipments`).
   Currently **no** admin notification — add it.

`[ASSUMPTION 4.b]` ECOTRACK honors `reference` as an idempotency/dedup key. If it does
**not**, we keep the `tracking_number IS NULL` + `FOR UPDATE` guard (sufficient within our
DB) and additionally short-circuit if `internal_shipment_id` already set.

### 4.2 Page-refresh / double-submit safety
- DB-level: row lock + `tracking_number IS NULL` guard = idempotent regardless of clicks or
  refreshes.
- API-level: `reference=order.id` dedups at ECOTRACK.
- UI-level: confirm modal + disabled button + `router.invalidate()` after success.

### 4.3 Files
- **Modify:** `src/routes/merchant/orders/-server/orders.api.ts` (`shipOrder`: wrap in
  `db.transaction` + `for('update')`, guards, `reference`, `stop_desk` from `delivery_type`,
  generate `internal_shipment_id`+`qr_token`, admin notify).
- **Create:** `src/routes/merchant/orders/-components/ShipConfirmModal.tsx`.
- **Modify:** `src/routes/merchant/orders/index.tsx` (wire modal, per-row lock),
  `OrdersTable.tsx` (open modal instead of immediate ship).
- **Reuse:** `src/server/delivery/label.ts` (Phase 5) for token/ref generation.
- **DB migrations:** none new (uses Phase 1 columns).

### 4.4 Success Criteria
- Firing `shipOrder` twice concurrently for one order creates **exactly one** ECOTRACK
  shipment and one `shipped` transition (integration test with a mocked client asserting
  `createOrder` called once).
- Refreshing mid-ship or clicking Ship twice never produces a second tracking number.
- ECOTRACK failure leaves the order `confirmed` with a surfaced error and **no** history row.
- Super Admin receives a notification on each successful shipment; an `internal_shipment_id`
  and `qr_token` are present post-ship.
- Office orders send `stop_desk=1`; home orders `stop_desk=0`.

---

## PHASE 5 — Internal QR Label + Super Admin Print Flow

### 5.1 Cryptographic token (HMAC, sound)

- **Secret:** new env `LABEL_HMAC_SECRET` (≥32 bytes, fail-closed if unset). Distinct from
  session/webhook secrets.
- **Token format (compact, self-describing):**
  `v1.<internal_shipment_id>.<issued_at_ms>.<sig>` where
  `sig = base64url( HMAC_SHA256( "<internal_shipment_id>.<issued_at_ms>", LABEL_HMAC_SECRET ) )`.
- **QR encodes the token string** — never the raw order id / tracking number.
- **Verify (`src/server/delivery/label.ts`):**
  1. parse → recompute HMAC → compare with `crypto.timingSafeEqual` (constant-time).
  2. **Expiry:** reject if `now - issued_at > 72h` (`[ASSUMPTION 5.a]` window = 72h).
  3. **Single use:** atomic claim
     `UPDATE orders SET label_token_used_at=now(), label_printed_at=now()
      WHERE id=? AND qr_token=? AND label_token_used_at IS NULL RETURNING id`.
     Zero rows → already used (replay) → reject.
- **Why sound:** key never leaves server; QR carries no secret-derivable PII; signature is
  unforgeable without the key; constant-time compare avoids timing oracle; expiry bounds
  replay; single-use is enforced by an atomic conditional UPDATE (not check-then-set).

### 5.2 Internal label (merchant side, after ship)
- Generated content: `internal_shipment_id` (human-readable), QR(token), `delivery_type` +
  office/commune name (if office), creation timestamp. **No customer PII, no ECOTRACK data.**
- Rendered as a printable component the merchant prints and attaches to the parcel.
- **New:** `src/routes/merchant/orders/-components/InternalLabel.tsx` + a "Print internal
  label" action on shipped rows (uses existing `window.print()` pattern / dedicated print CSS).

### 5.3 Super Admin shipments dashboard (new)
- **Route:** `src/routes/_dashboard/shipments/index.tsx` + `-server/shipments.api.ts`.
- All `shipped`+ orders auto-appear (no extra registration table needed — a query over
  `orders WHERE status IN ('shipped','at_wilaya','delivered','returned') AND tracking_number
  IS NOT NULL`). Columns: `internal_shipment_id`, merchant name, wilaya, `delivery_type`,
  office name, status, `label_printed_at`. Filter "pending print" = `label_printed_at IS NULL`.
- **Print official label:** Super Admin clicks Print →
  `printOfficialLabel({ token })`:
  1. `requireSuperAdmin`. 2. verify HMAC (5.1.1). 3. check expiry (5.1.2). 4. atomic
  single-use claim (5.1.3). 5. `getEcotrackClient(order.ecotrack_account_id).getLabel(tracking)`
  → PDF base64. 6. write `label_print_audit` (success/failure for **every** attempt).
  7. return PDF to render/print.
- **Bulk print:** select N pending → server returns N PDFs (or a merged PDF); each goes
  through the same verify→claim→fetch→audit pipeline; failures reported per-item (mirrors
  the bulk-ship error-collection pattern already in `merchant/orders/index.tsx`).

`[ASSUMPTION 5.b]` "Print Label" is keyed by the **scanned QR token** (the physical link
between parcel and shipment). A Super-Admin-initiated print from the dashboard row uses the
order's stored `qr_token` directly (no scan needed); the token check still runs so the
one-time-use + expiry + audit guarantees hold either way.

### 5.4 Super Admin delivery **pricing** settings page (new)
- Extend Settings → a new **DeliveryPricingTab** (sibling of existing `DeliveryTab.tsx`
  which manages accounts). Table: one row per wilaya — name, office price, home price, last
  synced, `admin_override` badge.
- **"Sync from ECOTRACK"** → `syncDeliveryCatalog()` (Phase 3.4); does **not** overwrite
  `admin_override=true` rows unless "force".
- **Manual edit** any price → `updateDeliveryPrice({wilaya_id, home, office})` sets
  `admin_override=true`.
- **"Reset to ECOTRACK" per row** → clears override + refetches that wilaya's fee.
- Server fns in `src/routes/_dashboard/integration/-server/delivery.api.ts` (or a new
  `pricing.api.ts`): `getDeliveryPricing`, `syncDeliveryPricing`, `updateDeliveryPrice`,
  `resetDeliveryPrice`. All `requireSuperAdmin`.

### 5.5 Anti-fraud (met)
- 72h expiry (5.1.2) · one-print-per-token via atomic claim (5.1.3) · `label_print_audit`
  on every attempt incl. failures (5.3) · official label fetch is **Super-Admin-only**
  (every endpoint guarded). Merchant never receives ECOTRACK label/PII.

### 5.6 Files
- **Create:** `src/server/delivery/label.ts`;
  `src/routes/_dashboard/shipments/index.tsx`, `…/-server/shipments.api.ts`,
  `…/-components/ShipmentsTable.tsx`, `…/-components/LabelPrintView.tsx`;
  `src/routes/merchant/orders/-components/InternalLabel.tsx`;
  `src/routes/_dashboard/settings/-components/DeliveryPricingTab.tsx`;
  pricing server fns (in `_dashboard/integration/-server/delivery.api.ts` or new `pricing.api.ts`).
- **Modify:** `src/routes/_dashboard/settings/index.tsx` + `-settings.types.ts` (add tab);
  `src/server/services/ecotrack.service.ts` (none required — `getLabel` already exists);
  Super Admin nav (`src/routes/_dashboard.tsx`) to add "Shipments".
- **DB migrations:** uses Phase 1 `0008_label_system` (label cols + `label_print_audit`).

### 5.7 Success Criteria
- Tampering with any token byte → verify fails (`invalid_signature`), audited, no label.
- Printing the same token twice → second attempt rejected `already_used`, audited; only one
  `label_printed_at`.
- Token older than 72h → `expired`, audited.
- Merchant has no route returning the ECOTRACK label or customer PII (grep + test).
- Internal label DOM contains no customer name/phone/address and no ECOTRACK fields.
- Pricing tab: edit sets `admin_override`; sync preserves overridden rows; per-row reset
  re-pulls ECOTRACK price.

---

## PHASE 6 — Manual Order Flow: Delivery Type + Pricing (create + edit)

> **Constraint enforced:** the order form **never** calls ECOTRACK. It reads
> `delivery_pricing` + `delivery_offices` only. (Today `AddLeadModal` calls
> `getDeliveryZones`/`getDeliveryCommunes`, which hit ECOTRACK live — this is removed.)

### 6.1 New local-catalog server fns (affiliate-readable)
- `getWilayasLocal()` → from `delivery_pricing` (code+name, sorted).
- `getOfficesLocal({wilayaId})` → from `delivery_offices` (stop-desk communes).
- `getCommunesLocal({wilayaId})` → commune list for **home** delivery (from
  `delivery_offices` is stop-desk-only, so home communes need either a cached commune list
  or we keep `delivery_offices` holding **all** communes with a `has_stop_desk` flag).
  `[ASSUMPTION 6.a]` We store **all** communes in `delivery_offices` with `has_stop_desk`
  boolean (office option enabled only when true), so one table serves both selectors and
  the form never calls ECOTRACK. (Refines Phase 1.4: drop the "only stop-desk" filter;
  keep the flag.)
- `getDeliveryPriceLocal({wilayaId})` → `{home_price_dzd, office_price_dzd}` from
  `delivery_pricing`.

### 6.2 Order creation flow
1. Affiliate fills name/phone/address.
2. Selects wilaya (from `getWilayasLocal`).
3. On wilaya select: load communes/offices (`getCommunesLocal`/`getOfficesLocal`) **and**
   prices (`getDeliveryPriceLocal`) — all local.
4. Selects `delivery_type` (home | office). If office → pick a stop-desk commune/office;
   show the selected price (home vs office) in DZD.
5. Save `delivery_type`, `delivery_office_id` (if office), `shipping_fee_dzd` (the chosen
   price snapshot), plus existing fields.
- **Server (`addLeadManual`) hardening:** validate `delivery_type`; if `office`, assert the
  office exists and belongs to the wilaya; **recompute price server-side** from
  `delivery_pricing` (never trust the client's price); keep `salePrice ≥ wholesale` check.

### 6.3 Order editing flow (new — does not exist today)
- **New** `EditOrderModal.tsx` + `updateOrderManual` server fn.
- Editable: name, phone, wilaya, address, commune/office, `delivery_type`, sale price,
  quantity, notes. Changing wilaya → dynamically reloads offices + prices (local).
  Changing `delivery_type` → updates displayed price. Final price shown before confirm.
- **Authorization & state:** affiliate must own the order. `[ASSUMPTION 6.b]` Free local
  edit only while `status IN ('pending','confirmed')` (pre-ship). For `shipped`+, edits must
  propagate to the carrier via `EcotrackService.updateOrder(tracking, …)` (note: update uses
  **different field names** — `client/tel/wilaya/product` — and requires the full set; the
  service already models this). Post-ship edit is **out of scope for v1** unless you confirm.
- **Atomicity + audit:** wrap in `db.transaction`; write an `order_status_history` row
  (`source='affiliate'`, `note='edited: <fields>'`) — `[ASSUMPTION 6.c]` we reuse
  `order_status_history` with a same-status note as the edit audit trail (no new table).

### 6.4 Data-source priority (enforced)
- Wilayas/communes/offices → `delivery_offices` (synced from ECOTRACK).
- Pricing → `delivery_pricing` (synced; Super-Admin-overridable).
- **Never** ECOTRACK from the form. `getDeliveryZones`/`getDeliveryCommunes` are **removed**
  (or repointed to local) and `AddLeadModal` updated accordingly.

### 6.5 Files
- **Modify:** `src/routes/affiliate/orders/-server/orders.api.ts` (add local catalog fns +
  `updateOrderManual`; harden `addLeadManual`; remove the live-ECOTRACK
  `getDeliveryZones`/`getDeliveryCommunes`).
- **Modify:** `src/routes/affiliate/orders/-orders.types.ts` (`AddLeadForm` +
  `EditOrderForm` gain `deliveryType`, `officeId`, `deliveryPrice`).
- **Modify:** `src/routes/affiliate/orders/-components/AddLeadModal.tsx` (local sources,
  delivery-type radio, office select, price display).
- **Create:** `src/routes/affiliate/orders/-components/EditOrderModal.tsx`.
- **Modify:** `src/routes/affiliate/orders/index.tsx` (+ marketplace `AddLeadModal` caller)
  to wire edit + pass local data.
- **DB migrations:** uses Phase 1 columns; no new migration.

### 6.6 Success Criteria
- Network trace while opening/using the order form shows **zero** requests to ECOTRACK /
  `getDeliveryZones` / `getDeliveryCommunes`; wilaya/office/price all come from local fns.
- Selecting office vs home changes the displayed DZD price; changing wilaya reloads offices
  and prices without a full reload.
- Created order persists `delivery_type`, `delivery_office_id` (office), and
  `shipping_fee_dzd` = server-recomputed price.
- Editing an existing order updates all fields atomically, reloads offices/prices on wilaya
  change, shows final price before save, and writes an audit history row.
- Server rejects a client-supplied price that disagrees with `delivery_pricing`.

---

## PHASE 7 — Extension Readiness Audit (PASS / FAIL / MISSING)

> Report only — no features. Verifies the platform can later accept extension-imported
> orders (WooCommerce/Shopify/custom).

| # | Requirement | Verdict | Evidence / Fix |
|---|-------------|---------|----------------|
| 7.1 | `external_order_id` uniqueness constraint in schema | **PASS** | `idx_orders_external_unique` (unique on `external_source,external_order_id` WHERE `external_order_id IS NOT NULL`) in `schema.ts`. |
| 7.2 | Duplicate prevention if same order submitted twice | **MISSING (guard)** | DB will reject the 2nd insert, but **no insert path uses `onConflictDoNothing` or catches the unique violation** — `addLeadManual` doesn't set external ids at all. **Fix:** the future import server fn must `INSERT … ON CONFLICT (external_source, external_order_id) DO NOTHING RETURNING id` and treat "no row" as "already imported". |
| 7.3 | DB-level lock/constraint vs two simultaneous inserts | **PASS (DB) / MISSING (handling)** | The partial unique index serializes concurrent inserts (one wins, one errors). Graceful handling = same fix as 7.2. |
| 7.4 | Affiliate attribution locked at creation & immutable | **PASS (de facto)** | `addLeadManual` sets `affiliate_id = profileId`; no code mutates `affiliate_id` afterward. **MISSING (enforcement):** not DB-enforced. Optional fix: omit `affiliate_id` from any update set / add a trigger. The Phase 6 `updateOrderManual` must **never** accept `affiliate_id`. |
| 7.5 | Status machine compatibility for imported orders | **PASS** | Imported orders enter `pending` like manual ones → same affiliate confirm → merchant ship path. `[ASSUMPTION 7.a]` imported orders start `pending` (await affiliate confirm). If they should auto-confirm, that's a new branch. |
| 7.6 | Imported orders can carry `delivery_type` + office | **FAIL → fixed by Phase 1/6** | Columns don't exist until Phase 1; import fn must accept them (Phase 6 adds the write path). After Phase 1+6 → PASS. |
| 7.7 | Idempotent re-sync of an updated external order | **MISSING** | Re-import currently can't update an existing order (no upsert path). **Fix:** decide insert-only vs upsert-on-conflict; document. |
| 7.8 | Ownership/tenancy on import (which affiliate) | **MISSING (auth surface)** | No import endpoint exists yet; when built it must `requireAffiliate` and bind `affiliate_id` to the caller (not client-supplied). |

**Net:** schema is import-ready (7.1/7.3/7.5 PASS); the gaps are all in **not-yet-built
insert paths** (7.2/7.7/7.8) and the **delivery columns** (7.6, resolved by Phases 1+6).
No schema change is strictly required for Phase 7 itself beyond what Phases 1/6 add.

### 7.9 Success Criteria
- This section exists as a PASS/FAIL/MISSING checklist (above) with a concrete fix for each
  non-PASS. No extension code is written.

---

## PHASE 8 — Platform-Wide Risk Register

| Priority | Area | Issue | Risk | Fix Required |
|----------|------|-------|------|--------------|
| **CRITICAL** | Ship flow (R1) | `shipOrder` has no row lock / idempotency key; `existingTracking` unused | Duplicate ECOTRACK shipments + double COD on double-click / refresh / concurrent merchants | Phase 4: `FOR UPDATE` + `tracking_number IS NULL` guard + `reference=order.id` |
| **CRITICAL** | RBAC / PII | `getMerchantOrders` + merchant UI expose customer name/phone/address/commune/note | PII leak to every merchant; legal/privacy breach | Phase 2: sanitized merchant view + PII-free type + UI edits |
| **CRITICAL** | Constraint breach | `api/webhooks/ecotrack.ts` exists despite "polling only" | Unspecified inbound status writes; violates design constraint | Phase 3.5: remove route (keep generic `applyEcotrackEvent`) |
| **HIGH** | Order form coupling | `AddLeadModal` calls ECOTRACK live (`getDeliveryZones`/`getDeliveryCommunes`) | Form breaks/slows on carrier downtime; rate-limit exposure; violates "read local only" | Phase 6: local catalog tables + remove live calls |
| **HIGH** | Delivery options | No `delivery_type`/office/price; ship hardcodes `stop_desk=0` (always home) | Office pickup impossible; wrong fees; no price shown to affiliate | Phases 1, 4, 6 |
| **HIGH** | Label security | `getLabel` unwired; no HMAC token, no one-time use, no audit, no admin gate | Once built naively → label/PII forgery & replay | Phase 5: HMAC + atomic single-use + audit + Super-Admin-only |
| **HIGH** | Secrets | New `LABEL_HMAC_SECRET` must be mandatory & strong | Forgeable labels if weak/missing | Phase 5: fail-closed if unset/short |
| **MEDIUM** | Polling cost/resilience | `syncAllActiveOrders` has no per-order TTL/backoff; linear transport retry | API hammering; wasted calls on dead trackings | Phase 3.3: TTL + exponential per-order backoff + jittered transport retry |
| **MEDIUM** | Import handling | Unique index present but no graceful conflict handling / upsert | Future import path errors on duplicates; no re-sync | Phase 7 fixes (7.2/7.7/7.8) when import is built |
| **MEDIUM** | Pricing override | Sync could clobber Super-Admin price edits | Manual pricing lost on each sync | Phase 5.4: respect `admin_override` unless forced; transactional sync |
| **MEDIUM** | Auth duplication | `requireX` copied across ~6 `*.api.ts` | Drift → an endpoint missing a check | Phase 2: central `src/server/auth/guards.ts` |
| **LOW** | Affiliate completeness | Affiliate order list omits address/commune; tracking only in modal | Reduced affiliate visibility (spec wants "full") | Phase 6: add to affiliate detail view |
| **LOW** | Status-map fragility | New ECOTRACK codes silently map to `null` | Missed transitions when carrier adds codes | Phase 3.2: guard test over label↔platform maps |
| **LOW** | Cancellation | `deleteOrder` (pre-ship cancel) not wired | Stuck phantom shipments on carrier | Optional: wire admin cancel → `deleteOrder` |
| **LOW** | Reconcile | `get/orders` nightly reconcile not scheduled | Drift if a poll is permanently missed | Optional nightly reconcile job |

---

## Appendix A — Consolidated new/changed file inventory

**New modules:** `src/server/auth/guards.ts`, `src/server/privacy/order-views.ts`,
`src/server/delivery/catalog-sync.ts`, `src/server/delivery/label.ts`.

**New routes/UI:** `src/routes/api/cron/sync-catalog.ts`,
`src/routes/_dashboard/shipments/{index.tsx,-server/shipments.api.ts,-components/*}`,
`src/routes/_dashboard/settings/-components/DeliveryPricingTab.tsx`,
`src/routes/merchant/orders/-components/{ShipConfirmModal.tsx,InternalLabel.tsx}`,
`src/routes/affiliate/orders/-components/EditOrderModal.tsx`.

**Modified (server):** `schema.ts`; `merchant/orders/-server/orders.api.ts`;
`affiliate/orders/-server/orders.api.ts`; `_dashboard/orders/-server/orders.api.ts`;
`_dashboard/integration/-server/delivery.api.ts`; `services/ecotrack.service.ts`;
`delivery/ecotrack-sync.ts`.

**Modified (UI/types):** merchant orders `index.tsx`/`OrdersTable.tsx`/`OrderDetailsModal.tsx`/`-orders.types.ts`;
affiliate orders `index.tsx`/`AddLeadModal.tsx`/`-orders.types.ts`;
`_dashboard/settings/index.tsx`+`-settings.types.ts`; `_dashboard.tsx` nav.

**Removed:** `src/routes/api/webhooks/ecotrack.ts` (Phase 3.5).

**Migrations:** `0006_delivery_catalog`, `0007_order_delivery_fields`, `0008_label_system`.

## Appendix B — New environment variables
- `LABEL_HMAC_SECRET` (required for Phase 5; ≥32 bytes).
- `CRON_SECRET` reused for `sync-catalog` (existing).
- `ECOTRACK_WEBHOOK_SECRET` becomes obsolete (route removed).

## Appendix C — Open questions to confirm before coding
1. (4.a) Ship precondition = `confirmed` (not `pending`). ✔ confirm.
2. (1.d/6) Is delivery cost added to COD `montant`, or display-only? 
3. (1.a) Do you want a visible `shipping_in_progress` status, or is the lock enough?
4. (3.b) Remove the webhook route, or keep it disabled + documented?
5. (4.b) Does ECOTRACK dedup on `reference`? (Affects belt-and-suspenders only.)
6. (5.a) Token expiry window = 72h?
7. (6.b) Post-ship edits in v1 (route through `update/order`), or pre-ship only?
8. (7.a) Imported orders start `pending` (await affiliate confirm) or auto-confirm?
```
