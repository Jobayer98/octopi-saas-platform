# Task Breakdown — Divide & Conquer

Rules for using this list:

- Work top to bottom — each phase depends on the one before it.
- **One task = one unit of work you finish, unit-test, manually verify, and commit before moving on.** Don't open two tasks at once.
- Checkbox per task. Add a short "what I'd do with more time" note next to anything you skip.
- Time-box guide assumes ~14–16 working hours across 2 days.

## Phase 0 — Scaffolding (~1h)

- [x] Init monorepo folders (`backend/`, `frontend/`, `docs/`, `scripts/`), root `.gitignore`
- [x] Backend: Express + TS + tsx/ts-node-dev, eslint+prettier, `.env.example`
- [ ] Frontend: Next.js (App Router) + TS + Tailwind + shadcn init
- [x] `docker-compose.yml` for Postgres
- [ ] Root README skeleton with "How to run locally" placeholder (fill in as you go, not at the end)

## Phase 1 — Database foundation (~1.5h)

- [x] Write `schema.prisma` (from DATABASE-SCHEMA.md)
- [x] First migration, generate client
- [x] `seed.ts`: platform admin, 2 demo plans, one demo org+admin+member (all three login roles ready from day 1 — you need this for every later manual test)
- [x] Unit test: none yet (schema has no logic) — **manual test:** `prisma studio`, confirm relations

## Phase 2 — Common/DI foundation (~1h)

- [x] `common/errors/` (AppError hierarchy)
- [x] `common/middlewares/errorHandler.ts` (maps AppError → clean JSON, hides stack in prod)
- [x] `common/di/container.ts` (see dev guide — simple factory-based container)
- [x] `context/tenant-context.ts` (AsyncLocalStorage)
- [x] `common/utils/hashing.ts`, `jwt.ts`
- [x] Unit test: jwt sign/verify round-trip, hashing round-trip

## Phase 3 — Auth module (~2.5h)

- [x] `auth.repository.ts` (User CRUD by email/id)
- [x] `auth.service.ts`: register (org+admin, PENDING_PAYMENT), login, refresh, logout, forgot/reset password
- [x] `middlewares/authenticate.ts`, `authorizeRole.ts`, `authorizeTenant.ts`
- [x] Rate limiter on login/forgot-password
- [x] Routes + validation (zod)
- [x] **Unit tests:** login success/failure, expired token rejected, wrong role rejected, wrong-tenant rejected
- [x] **Manual test:** Postman/Thunder Client run through register→login→refresh→logout
- [x] Commit: `feat(auth): registration, login, jwt refresh, rbac guards`

## Phase 4 — Plans + Platform org management (no payment yet) (~1.5h)

- [x] `plans` module: CRUD (PLATFORM_ADMIN only)
- [x] `organizations` module: list/search/filter, detail, suspend/reactivate (PLATFORM_ADMIN only)
- [x] **Unit tests:** non-admin blocked from plan CRUD; suspend flips status correctly
- [x] Commit: `feat(platform): plan management, org listing, suspend/reactivate`

## Phase 5 — Stripe checkout + webhook (the core risk area — budget extra time) (~3h)

- [x] Stripe test account, products/prices (or dynamic price_data)
- [x] `payment-provider.interface.ts` + `stripe.provider.ts` (createCheckoutSession, verifyWebhookSignature)
- [x] `POST /checkout/session` — creates session for PENDING org
- [x] Raw-body webhook route mounted **before** `express.json()`
- [x] Webhook handler: verify signature → check `WebhookEvent` → `$transaction` (org ACTIVE, subscription upsert, payment SUCCESS, transaction SUCCESS) → post-commit notification call
- [x] Failure path: `checkout.session.expired` / payment_failed → Payment(FAILED)+Transaction(FAILED), org stays PENDING_PAYMENT
- [x] **Unit tests:** duplicate webhook event id → no-op (assert only 1 Payment row exists); invalid signature → 400; failed payment leaves org non-active
- [x] **Manual test:** Stripe CLI `stripe trigger checkout.session.completed`, replay same event twice, confirm no duplication in DB
- [x] Commit: `feat(payments): stripe checkout + idempotent webhook handling`

## Phase 6 — Org Admin panel APIs (~2h)

- [x] `org/profile` GET/PATCH
- [x] `members` — list, invite (+ Invite token + email trigger), role change, remove
- [x] `subscription` — view, upgrade/downgrade (new checkout session), cancel
- [x] `billing/payments` — org's own history only (tenant-guarded)
- [x] `org/transactions` — filter by status
- [x] **Unit tests:** member of org A cannot fetch org B's members/payments (tenant isolation test — this one matters most for grading)
- [x] Commit: `feat(org-admin): members, subscription mgmt, billing history`

## Phase 7 — Org Member panel APIs (~0.5h)

- [x] `me/profile` GET/PATCH, `me/password`
- [x] `org/info` reusing org profile service with field-trimming by role
- [x] **Unit test:** member response never contains billing fields
- [x] Commit: `feat(org-member): profile + read-only org info`

## Phase 8 — Notifications (~1h)

- [x] `notification-provider.interface.ts` + `nodemailer.provider.ts` (Maildev/Ethereal)
- [x] Wire triggers: invite sent, payment success/fail, sub upgraded/downgraded/cancelled, expiring-soon reminder (simple date-check function, invoked manually or via a small cron-like script for v1 — no queue)
- [x] `NotificationLog` write on every send/fail
- [x] **Unit test:** provider called with correct template data; failure doesn't throw past caller (logged, not fatal)
- [x] Commit: `feat(notifications): pluggable email provider + event triggers`

## Phase 9 — Platform stats + transactions page API (~0.5h)

- [x] `/platform/stats` aggregation query
- [x] `/platform/transactions` with filters
- [x] Commit: `feat(platform): stats overview + platform-wide transactions`

## Phase 10 — Frontend (parallel-izable once APIs above exist) (~4h)

- [ ] `lib/api-client.ts` (bearer header, silent refresh on 401, typed error shape)
- [ ] Auth pages (login/register/forgot/reset) + route protection (middleware.ts checking cookie/role)
- [ ] Checkout page (Stripe redirect) + return/status polling page
- [ ] Platform Admin: orgs list+detail, plans CRUD, transactions, stats dashboard
- [ ] Org Admin: profile, members, subscription, billing, transactions
- [ ] Org Member: profile, org-info
- [ ] Loading/error/empty states on every data view (TanStack Query states, not ad hoc)
- [ ] **Manual test:** full click-through for all 3 roles

## Phase 11 — Error handling + security + rate limiting pass (~1h)

- [x] Global error handler returns consistent `{ error: { code, message } }`, no stack leaks in prod
- [x] Rate limit sensitive endpoints
- [x] Input validation on every POST/PATCH (zod, backend-authoritative even though frontend also validates)
- [x] CORS locked to frontend origin
- [x] Helmet-equivalent security headers
- [x] Re-audit: any tenant-scoped repository method missing `organizationId`? (grep-check)

## Phase 12 — Tests pass + README (~1.5h)

- [ ] Fill in README (architecture, tradeoffs, known limitations — be honest per the assessment's own note)
- [x] Seed script produces 3 working login credentials, document them

## Bonus (only after everything above is solid)

- [ ] GitHub Actions: lint + test + build on push
- [ ] Invoice PDF generation (Puppeteer) from Payment
- [ ] Per-org SMTP config (encrypted at rest) — implement as a second `NotificationProvider` implementation to prove the interface actually supports it, don't hack it into the existing one
