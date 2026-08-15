# API Design (REST)

Convention: `/api/v1/...`, JSON in/out, JWT bearer for access token, refresh token in httpOnly cookie. Every non-public route passes through `authenticate` → role guard → (tenant guard where applicable).

## Auth — public + self-service

| Method | Path                  | Guard                | Notes                                                                   |
| ------ | --------------------- | -------------------- | ----------------------------------------------------------------------- |
| POST   | /auth/register        | public               | creates org(PENDING_PAYMENT)+admin user, returns checkout redirect info |
| POST   | /auth/login           | public, rate-limited | returns access token + sets refresh cookie                              |
| POST   | /auth/refresh         | public (cookie)      | rotates refresh token                                                   |
| POST   | /auth/logout          | authenticated        | revokes refresh token                                                   |
| POST   | /auth/forgot-password | public, rate-limited | emails reset token                                                      |
| POST   | /auth/reset-password  | public               | consumes token, sets new password                                       |
| GET    | /auth/me              | authenticated        | current user + role + org summary                                       |

## Checkout / Payments

| Method | Path                                          | Guard                                          | Notes                                                                              |
| ------ | --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| POST   | /checkout/session                             | authenticated (org exists, PENDING)            | creates Stripe Checkout Session for given planId                                   |
| GET    | /checkout/status/:orgId                       | authenticated                                  | poll org/subscription status after redirect (UX only — webhook is source of truth) |
| POST   | /webhooks/stripe                              | **none** (raw body + signature verify instead) | idempotent handler, see architecture doc                                           |
| POST   | /billing/checkout-session (upgrade/downgrade) | ORG_ADMIN + tenant guard                       | new Stripe session for plan change                                                 |

## Platform Admin

| Method | Path                                   | Notes                                                                          |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------ |
| GET    | /platform/organizations                | list+search+filter(status,plan,date)                                           |
| GET    | /platform/organizations/:id            | full profile+members+subs+payments                                             |
| PATCH  | /platform/organizations/:id/suspend    |                                                                                |
| PATCH  | /platform/organizations/:id/reactivate |                                                                                |
| GET    | /platform/plans                        |                                                                                |
| POST   | /platform/plans                        |                                                                                |
| PATCH  | /platform/plans/:id                    |                                                                                |
| PATCH  | /platform/plans/:id/disable            |                                                                                |
| GET    | /platform/transactions                 | platform-wide, filter org/status/date                                          |
| GET    | /platform/stats                        | orgs count, users count, active subs, revenue, failed payments, recent signups |

## Organization Admin (all tenant-guarded on `organizationId` from token)

| Method | Path                             | Notes                        |
| ------ | -------------------------------- | ---------------------------- |
| GET    | /org/profile                     |                              |
| PATCH  | /org/profile                     | name, contact, billing email |
| GET    | /org/members                     |                              |
| POST   | /org/members/invite              | triggers Invite + email      |
| POST   | /org/members/accept-invite       | public but token-gated       |
| PATCH  | /org/members/:userId/role        |                              |
| DELETE | /org/members/:userId             |                              |
| GET    | /org/subscription                |                              |
| POST   | /org/subscription/upgrade        |                              |
| POST   | /org/subscription/downgrade      |                              |
| POST   | /org/subscription/cancel         |                              |
| GET    | /org/billing/payments            | org's own payment history    |
| GET    | /org/billing/invoices/:paymentId | bonus: PDF                   |
| GET    | /org/transactions                | filter by status             |

## Organization Member

| Method | Path         | Notes                                                                                                                                                |
| ------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /me/profile  |                                                                                                                                                      |
| PATCH  | /me/profile  |                                                                                                                                                      |
| PATCH  | /me/password |                                                                                                                                                      |
| GET    | /org/info    | read-only, no financials — reuse GET /org/profile but strip financial fields based on role in the SAME service method (don't duplicate the endpoint) |

## Design rules baked in

1. **No route ever trusts a body-supplied `organizationId`.** Org-scoped routes derive `organizationId` from the authenticated user's token, never from the request payload — this is the #1 way tenant isolation bugs happen.
2. **Same GET /org/profile endpoint serves both ORG_ADMIN and ORG_MEMBER**, with the service layer trimming financial fields by role — avoids duplicating near-identical endpoints (DRY, also matches "read-only view" requirement without a second controller).
3. Webhook route is mounted **before** the global JSON body parser (needs raw body for Stripe signature verification) — call this out explicitly in Express app setup so you don't lose an evening to it.
