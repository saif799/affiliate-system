# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server on http://localhost:3000
npm run build    # Production build
npm run preview  # Preview the production build
npm run test     # Run all tests once (Vitest)
npm run lint     # ESLint (@tanstack/eslint-config)
npm run format   # Prettier check
npm run check    # prettier --write . && eslint --fix
```

Run a single test: `npx vitest run path/to/file.test.ts` or filter by name with `npx vitest run -t "test name"`. Use `npx vitest` (no `run`) for watch mode.

**Database (Drizzle Kit, no npm scripts defined — invoke directly):**
```bash
npx drizzle-kit generate   # Generate SQL migrations from schema.ts into ./drizzle
npx drizzle-kit migrate    # Apply migrations
npx drizzle-kit push       # Push schema directly (dev)
npx drizzle-kit studio     # Browse the DB
```

**Adding shadcn/ui components** (style: new-york, base color: zinc):
```bash
pnpm dlx shadcn@latest add <component>
```

Requires a `DATABASE_URL` (Postgres) in `.env`. Other env vars used: `RESEND_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` (dev email), `VITE_APP_URL`, `NODE_ENV`.

## Architecture

This is a **TanStack Start** app (full-stack React 19 + SSR, built on Vite and TanStack Router) for an **Algerian affiliate / dropshipping platform** (currency is DZD stored as integers, `wilaya` = province, payouts via CCP/BaridiMob, COD-style order lifecycle).

### Three role-based portals
There are three top-level layout routes, each guarding access by user role in `beforeLoad`:
- `src/routes/_dashboard.tsx` → **Super Admin** (role `super_admin`); children at `_dashboard/*` (affiliates, merchants, products, commissions, analytics, integration, settings).
- `src/routes/merchant.tsx` → **Merchant** portal (`merchant/*`).
- `src/routes/affiliate.tsx` → **Affiliate** portal (`affiliate/*`).

Each guard redirects to `/login` if there's no session, to `/pending-approval` if `status !== 'active'`, and to `/login` if the role doesn't match. `_auth.tsx` wraps login/register.

### Routing & file conventions (TanStack Router, file-based)
- `src/routeTree.gen.ts` is **auto-generated** — never edit it by hand.
- The `-` prefix excludes a file/folder from route generation. Each route folder follows a consistent layout:
  - `-server/*.api.ts` — server functions (`createServerFn`) for that feature.
  - `-server/*.mock.ts` — mock data (much of the UI still renders from mocks; real DB-backed APIs are being filled in).
  - `-<feature>.types.ts` — types for the feature.
  - `-components/` — components used only by that route.
- `-data/`, `-shared/`, `-components/` directly under `src/routes/` hold cross-route shared pieces (e.g. landing page).
- API/HTTP routes use the `server.handlers` form, e.g. the better-auth catch-all at `src/routes/api/auth/$.ts`.

### Auth (better-auth)
- Configured in `src/server/auth.ts`: Drizzle adapter over Postgres, email+password, plus a **magic-link invitation flow**. `tanstackStartCookies()` handles session cookies.
- Invitations: `setInviteType(email, type)` stashes whether an invite is for `admin | merchant | affiliate`, then the magic-link sender picks the matching Arabic email template. In `development` mail goes through Gmail (nodemailer); in production through Resend.
- A `databaseHooks.user.create.after` hook auto-creates the `affiliate_profiles` / `merchant_profiles` row for new users (idempotent — invite flows may have created it already).
- Client side: `src/lib/auth-client.ts` exports `signIn/signUp/signOut/useSession`.
- **Session in router context**: `__root.tsx` runs `getSession()` in `beforeLoad` and puts `session` on the router context, so any route can read `context.session`. `getSession` (`src/lib/session.ts`) is a server function reading headers via better-auth. Server functions that need authorization re-check the session themselves (see `requireSuperAdmin` in `merchants.api.ts`).

### Database (Drizzle ORM + postgres-js)
- Single schema file `src/server/db/schema.ts`; client in `src/server/db/index.ts` (`db`).
- Core tables: `users` (+ `merchant_profiles`, `affiliate_profiles`), better-auth `sessions`/`accounts`/`verifications`, `products`, `tracking_links`, `orders` (+ `order_status_history`), `wallets`, `transactions`, `withdrawal_requests`, `settings`.
- Conventions: **soft deletes** via `deleted_at` (unique indexes are filtered on `deleted_at IS NULL`); money is integer DZD columns (`*_dzd`); enums are Postgres `pgEnum`s (roles, order status, transaction type, payout method, etc.); CHECK constraints enforce non-negative amounts.

### Imports & aliases
Use the `#/*` path alias for `src/*` (defined in `package.json` `imports` and resolved by `vite-tsconfig-paths`), e.g. `import { db } from '#/server/db'`. shadcn aliases (`components.json`) also map to `#/` (`#/components`, `#/lib/utils`, `#/components/ui`).

### Notable
- Comments and email templates are often in Arabic / French; commit messages too. Match the surrounding language when editing those.
- Files prefixed `demo*` are scaffolding leftovers and can be removed safely.
