# Task: Diagnose and fix an authentication hang on the deployed app

## Summary
Login is broken on the deployed app. When a user submits the login form, the request **hangs indefinitely** (it never resolves — no error shown to the user, the spinner just spins forever). I need you to investigate the root cause yourself and fix it. Do not assume the first plausible cause is the real one — confirm it against the actual code and configuration before changing anything.

## Environment
- The app is a **TanStack Start** application (TanStack Router, not React Router), built with Vite + Nitro.
- It is **deployed on Vercel** (production). The build succeeds and routes render correctly — this is purely an auth/session problem, not a routing or build problem.
- Auth is handled by **better-auth**.
- The database is **Neon Postgres**, accessed through **Drizzle ORM**.
- Sessions are stored in the database (there is a `sessions` table that better-auth queries on each request).

## History that matters (so you don't re-tread it)
- The app was **previously deployed on Cloudflare Workers**, where it threw: `Cannot perform I/O on behalf of a different request ... This is a limitation of Cloudflare Workers`, originating from better-auth's session lookup query. That specific Workers I/O error is **gone** now that we are on Vercel.
- **Crucially: the auth hang persists on Vercel even though the Workers error is gone.** This means the auth failure has a cause that is *independent* of the Cloudflare Workers runtime limitation. Do not attribute the current hang to the Workers I/O issue — that was a separate, now-resolved problem. The current hang is something else and must be diagnosed fresh.
- Earlier symptom detail (may or may not still be relevant): in a normal browser with an existing session cookie the request failed immediately, while a fresh/incognito session got further but then hung at login. This suggested both a possible stale-cookie effect and a genuine session read/write failure underneath.

## What I need from you
1. **Investigate before fixing.** Inspect the actual code and configuration: the database client setup (how and where the Drizzle/Neon client is instantiated), the better-auth initialization, how environment variables are read, the connection string in use, and how better-auth's baseURL/secret and cookies are configured for the deployed domain.
2. **Form a specific hypothesis** about why the request hangs forever (a hang, as opposed to an error, is an important clue about where to look — think about what kinds of operations block indefinitely rather than failing fast in a serverless context).
3. **Verify the hypothesis** against the evidence (the code, the env configuration, and ideally the Vercel function/runtime logs during a login attempt) before making changes. State what evidence confirms it.
4. **Implement the fix**, and explain what was actually wrong and why it caused a hang specifically (not an error).
5. **Check for related latent issues** of the same class elsewhere in the codebase, since the same root cause may affect other database- or auth-touching paths, not just login.

## Constraints
- The fix must work in the **Vercel** deployment environment (consider the characteristics of the runtime the app actually runs in there, and how that interacts with database connections and with how environment variables are provided).
- Do not introduce a new hosting platform or a major architectural rewrite as the solution; the app needs to run correctly where it is deployed.
- Keep secrets and connection strings in environment variables; do not hardcode them.
- If part of the root cause is environmental (e.g. a value that must be set in the Vercel project settings rather than in code), say so explicitly and tell me exactly what I need to set on Vercel's side — distinguish clearly between "code changes you made" and "configuration I must do in the Vercel dashboard."

## Deliverable
A clear explanation of the confirmed root cause, the code changes you made, any Vercel-side configuration I must apply, and how to verify the login flow now completes successfully end to end.