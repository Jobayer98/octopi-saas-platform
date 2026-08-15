# Development Guide

## 1. The per-task loop (follow this every single time)

1. Pick the next unchecked task from `TASK-BREAKDOWN.md` — only one.
2. Implement it fully within its module boundary (route→controller→service→repository).
3. Write the unit test(s) for it (service logic, mocked repository/provider).
4. Manually verify (Postman/Thunder Client collection, or UI click-through once frontend exists).
5. Add short comments only where the _why_ isn't obvious from the code (see commenting rule below).
6. Commit (see git guide — one logical commit per task, conventional message).
7. Check the box, move to the next task.

Never start task N+1 with task N half-working. This is the single biggest thing graders notice in a rushed 2-day submission — half-finished parallel threads vs. clean finished slices.

## 2. Commenting rule

Comment **decisions**, not **mechanics**. Bad: `// loop through users`. Good: `// webhook event id doubles as idempotency key — DO NOT remove this check`. If a comment restates the code, delete it; if a comment explains a tradeoff, keep it.

## 3. SOLID, applied concretely (not abstractly)

**SRP** — a service method does one business operation. `PaymentService.handleStripeWebhook()` does not also send email directly — it calls `NotificationService.notify(...)` and returns. A controller never contains an `if (role === ...)` business rule — that's the guard's/service's job.

**OCP — the one the assessment explicitly tests ("add payment/notification providers without breaking existing code")**

Define the seam as an interface the service depends on, never the concrete class:

```ts
// modules/payments/providers/payment-provider.interface.ts
export interface PaymentProvider {
  createCheckoutSession(
    input: CreateSessionInput,
  ): Promise<{ url: string; sessionId: string }>;
  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
  ): WebhookEventPayload;
}
```

```ts
// modules/payments/payments.service.ts
export class PaymentsService {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly repo: PaymentsRepository,
  ) {}
  // ... never imports "stripe" directly
}
```

Adding PayPal later = write `paypal.provider.ts` implementing the same interface, swap it in the DI container's factory. **Zero lines change in `payments.service.ts` or any controller.** That's what "open for extension, closed for modification" means in practice — write this exact reasoning into the README's payment section, it directly answers the grading criterion.

Same pattern for `NotificationProvider` (nodemailer today, SendGrid/Resend/per-org-SMTP later — the bonus point literally asks you to add a second provider, which is free if you did this right from Phase 8).

**LSP** — any `PaymentProvider` implementation must honor the same contract (e.g. `createCheckoutSession` always returns a URL or throws a typed `PaymentProviderError` — never returns `null` in one implementation and throws in another).

**ISP** — don't make one giant `IProvider` interface with 15 methods; `PaymentProvider` and `NotificationProvider` are separate, small, focused interfaces.

**DIP** — services depend on interfaces (`PaymentProvider`), never on `import Stripe from 'stripe'` directly. Only the concrete provider file imports the Stripe SDK.

## 4. Dependency Injection — without a DI library

You don't need InversifyJS/tsyringe for this scope. Use **manual constructor injection + a tiny composition root**:

```ts
// common/di/container.ts
import { StripeProvider } from "../../modules/payments/providers/stripe.provider";
import { PaymentsRepository } from "../../modules/payments/payments.repository";
import { PaymentsService } from "../../modules/payments/payments.service";
import { NodemailerProvider } from "../../modules/notifications/providers/nodemailer.provider";
import { NotificationsService } from "../../modules/notifications/notifications.service";

// Composition root: the ONLY file that wires concrete implementations together
const paymentProvider = new StripeProvider(process.env.STRIPE_SECRET_KEY!);
const notificationProvider = new NodemailerProvider(/* smtp config */);

export const notificationsService = new NotificationsService(
  notificationProvider,
);
export const paymentsRepository = new PaymentsRepository(prisma);
export const paymentsService = new PaymentsService(
  paymentProvider,
  paymentsRepository,
  notificationsService,
);
```

Controllers import the pre-wired singletons from `container.ts` — they never `new` a service themselves. This gives you the two things DI is actually for at this scale: (1) tests can construct `new PaymentsService(fakeProvider, fakeRepo, fakeNotifier)` with mocks, no framework needed; (2) swapping an implementation is a one-line change in exactly one file.

## 5. Testing approach

- **Unit tests** (majority): service classes constructed with hand-rolled mock repositories/providers (plain objects implementing the interface, no mocking library required, though `vitest`'s `vi.fn()` is fine too). Test business rules: role checks, tenant scoping, idempotency, rollback-on-failure.
- **Integration tests** (few, high-value): Supertest against a real test Postgres (docker-compose test service or a `.env.test`), covering: full auth flow, a full webhook round-trip (mock Stripe signature verification only, hit the real DB), a cross-tenant access attempt (expect 403/404).
- Don't chase coverage % — the assessment explicitly says so. Prioritize: auth, role authorization, tenant isolation, payment flow, duplicate webhook, transaction rollback (this is literally the required list — treat it as your test plan).

## 6. Preventing duplicate code — concrete checks, not vibes

- Any validation logic (e.g. "amount must be positive", "email format") lives in one zod schema in `common/validation/`, imported wherever needed — never re-typed as a manual `if`.
- Any formatting (money cents→display, date formatting) lives in `common/utils/` — grep for a second occurrence before writing a helper inline.
- `authorizeTenant` middleware is the _only_ place tenant-mismatch is checked — services trust that a route wrapped in it already has a validated `organizationId` in context; they don't re-check it ad hoc (but repositories still require the param — belt and suspenders, not duplicated logic, since the repository requirement is a type-level contract, not a re-implementation of the check).

## 7. Performance basics for this scope

- Paginate every list endpoint (orgs, members, transactions, payments) — `?page&limit`, default limit ~20-25.
- Select only needed fields in Prisma queries for list views (`select`, not full row) — matters once org/transaction counts grow.
- Indexes already specified in DATABASE-SCHEMA.md — don't add more speculatively.
- No N+1: use Prisma `include`/`select` with relations in one query for detail pages (e.g. org detail + members + subscription in one call), not sequential awaits.
