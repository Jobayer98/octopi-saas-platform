# [Project Name] — Multi-Tenant SaaS Subscription Platform

## 1. Overview

One paragraph: what it does, tech stack, current completion status (be honest — the assessment explicitly rewards honesty about what's partial).

## 2. Architecture

Link/summarize `docs/01-ARCHITECTURE.md`: modular monolith, layering (route→controller→service→repository), why monolith over microservices for this scope.

## 3. Database Design

Link/summarize `docs/02-DATABASE-SCHEMA.md`: entities, key relationships, indexing choices. Include the actual ERD image once schema is final (export from `prisma-erd-generator` or draw.io).

## 4. Multi-Tenant Approach

This is 15% of the grade — be explicit and thorough:

- Shared DB, shared schema, `organizationId` discriminator.
- Two enforcement layers: repository-required param + Prisma middleware reading AsyncLocalStorage tenant context.
- How Platform Admin cross-tenant access is separately gated.
- What you'd do differently at 10,000+ orgs (schema-per-tenant or row-level security policies) and why you didn't do that for v1.

## 5. Auth Strategy

JWT access+refresh, bcrypt, guard chain, password reset flow. Token lifetimes used.

## 6. Payment Flow

Diagram/describe: signup → checkout session → webhook → transaction. Idempotency mechanism (WebhookEvent as ledger). Failure handling.

## 7. Transaction/Rollback Approach

How `prisma.$transaction` wraps the multi-record webhook update; what happens if any step throws (whole transaction rolled back, org never left partially updated).

## 8. Security Notes

- Passwords hashed (bcrypt/argon2), never logged.
- No card data touches your server (Stripe Checkout hosted page / Elements + tokens only).
- Webhook signature verification.
- Env-var secrets, `.env` gitignored.
- Rate limiting on auth endpoints.
- Server-side authorization on every route (not just hidden UI).

## 9. How AI Tools Were Used

Be specific and honest (this is explicitly reviewed in the call): which parts were AI-drafted vs hand-written, what you changed, and be ready to explain any line of it live.

## 10. How to Run Locally

```bash
git clone <repo>
cd <repo>
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d          # postgres + maildev
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

Stripe: `stripe listen --forward-to localhost:<port>/api/v1/webhooks/stripe` for local webhook testing.

## 11. Required Environment Variables

| Var                                           | Where    | Purpose             |
| --------------------------------------------- | -------- | ------------------- |
| `DATABASE_URL`                                | backend  | Postgres connection |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`    | backend  | token signing       |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | backend  | payments            |
| `SMTP_HOST/PORT/USER/PASS`                    | backend  | email sandbox       |
| `NEXT_PUBLIC_API_URL`                         | frontend | backend base URL    |

## 12. Test Credentials

| Role           | Email | Password |
| -------------- | ----- | -------- |
| Platform Admin |       |          |
| Org Admin      |       |          |
| Org Member     |       |          |

## 13. Known Limitations / What I'd Do Next

Be honest and specific — list what's partial, what's skipped, and the reasoning (time-boxing, not laziness).
