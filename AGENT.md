# AGENT.md — Instructions for AI coding assistants

This file exists so any AI tool working in this repo behaves consistently with the human dev's decisions, instead of re-deriving architecture each session. Read this before generating code.

## What this project is

Multi-tenant SaaS subscription platform (Jr. Full-Stack technical assessment for Octopi Digital). Monolithic backend (Express+TS+Prisma+Postgres), Next.js+shadcn frontend. Full spec: `docs/01-ARCHITECTURE.md`, `docs/02-DATABASE-SCHEMA.md`, `docs/03-API-DESIGN.md`. Current task state: `docs/05-TASK-BREAKDOWN.md`.

## Non-negotiable constraints — do not deviate without being asked

1. **No microservices, no Redis, no BullMQ, no message queue for v1.** In-process only. If a task seems to need a queue, implement it synchronously or as a simple scheduled function instead, and note the tradeoff — don't silently add infrastructure.
2. **Multi-tenancy:** every tenant-scoped repository method takes `organizationId` as an explicit required parameter — never write a repository method that queries `Payment`/`Subscription`/`Transaction`/org-scoped `User` rows without it. Never derive `organizationId` from the request body — always from the authenticated user's token/context.
3. **Payments/notifications go through the `PaymentProvider` / `NotificationProvider` interfaces** (`modules/payments/providers/`, `modules/notifications/providers/`). Services depend on the interface type, never import `stripe` or `nodemailer` directly outside the concrete provider file.
4. **Webhook idempotency:** the Stripe `event.id` is written to `WebhookEvent` inside the same `prisma.$transaction` as every side effect it causes. Never process a webhook's side effects before checking whether that event id already exists.
5. **Layering:** Route → Controller (HTTP only, no business logic) → Service (business logic, talks to interfaces) → Repository (only place Prisma is imported). Don't let a controller call Prisma directly, ever.
6. **No new npm dependency without a one-line justification** in the commit message — this is a "no third-party pkg sprawl" v1, keep the dependency tree small and explainable.

## When asked to implement a task from TASK-BREAKDOWN.md

1. Implement only that task's scope — don't jump ahead to later phases or add unrequested features (the assessment explicitly penalizes scope creep: "Build exactly what's described above — nothing more").
2. Follow the existing module shape exactly (`x.routes.ts`, `x.controller.ts`, `x.service.ts`, `x.repository.ts`, `x.validation.ts`, `x.types.ts`) — match whatever pattern already exists in a sibling module rather than inventing a new shape.
3. Write the unit test for the task in the same response/commit, not as a follow-up.
4. Flag (don't silently fix) anything that looks like it contradicts an earlier decision in `docs/` — ask before overriding an ADR.

## Style

- TypeScript strict mode, no `any` without a comment explaining why it's unavoidable.
- Prefer explicit return types on service/repository public methods.
- Errors are typed (`AppError` subclasses in `common/errors/`), never raw `throw new Error(string)` in service code.
- zod schemas are the single source of truth for input validation — don't hand-roll `if (!req.body.x)` checks.
