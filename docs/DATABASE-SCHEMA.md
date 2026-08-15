# Database Design (PostgreSQL + Prisma)

## Entity list

`Organization, User, Plan, Subscription, Payment, Transaction, WebhookEvent, RefreshToken, PasswordResetToken, NotificationLog, Invite`

## ERD (textual)

```
Organization 1───* User
Organization 1───1 Subscription (current)  [+ history via Subscription rows, latest = current]
Organization 1───* Payment
Organization 1───* Transaction
Organization 1───* Invite
Plan          1───* Subscription
Subscription  1───* Payment
Payment       1───1 Transaction (usually; Transaction can also exist standalone for e.g. rollback records)
User          1───* RefreshToken
User          1───* PasswordResetToken
```

## Prisma schema (design-level — write exact field types when implementing)

```prisma
enum Role {
  PLATFORM_ADMIN
  ORG_ADMIN
  ORG_MEMBER
}

enum OrgStatus {
  PENDING_PAYMENT
  ACTIVE
  TRIAL
  SUSPENDED
  CANCELLED
}

enum SubscriptionStatus {
  ACTIVE
  PENDING
  FAILED
  CANCELLED
  EXPIRED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
  ROLLED_BACK
}

enum BillingInterval {
  MONTHLY
  YEARLY
}

model Organization {
  id             String     @id @default(cuid())
  name           String
  billingEmail   String
  contactInfo    Json?
  status         OrgStatus  @default(PENDING_PAYMENT)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  users          User[]
  subscriptions  Subscription[]
  payments       Payment[]
  transactions   Transaction[]
  invites        Invite[]

  @@index([status])
}

model User {
  id             String    @id @default(cuid())
  organizationId String?   // null ONLY for PLATFORM_ADMIN
  email          String    @unique
  passwordHash   String
  name           String
  role           Role
  status         String    @default("ACTIVE") // ACTIVE | REMOVED
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization   Organization? @relation(fields: [organizationId], references: [id])
  refreshTokens  RefreshToken[]
  resetTokens    PasswordResetToken[]

  @@index([organizationId])
}

model Plan {
  id             String    @id @default(cuid())
  name           String
  priceCents     Int
  billingInterval BillingInterval
  features       Json      // string[] rendered as JSON
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())

  subscriptions  Subscription[]
}

model Subscription {
  id             String    @id @default(cuid())
  organizationId String
  planId         String
  status         SubscriptionStatus @default(PENDING)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  stripeSubscriptionId String? // if using Stripe Subscriptions; optional for Checkout-only flow
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  plan           Plan         @relation(fields: [planId], references: [id])
  payments       Payment[]

  @@index([organizationId])
}

model Payment {
  id              String   @id @default(cuid())
  organizationId  String
  subscriptionId  String?
  amountCents     Int
  currency        String   @default("usd")
  status          PaymentStatus @default(PENDING)
  stripePaymentIntentId String? @unique
  stripeCheckoutSessionId String? @unique
  failureReason   String?
  createdAt       DateTime @default(now())

  organization    Organization @relation(fields: [organizationId], references: [id])
  subscription    Subscription? @relation(fields: [subscriptionId], references: [id])
  transaction     Transaction?

  @@index([organizationId])
}

model Transaction {
  id             String   @id @default(cuid())
  organizationId String
  paymentId      String?  @unique
  type           String   // SUBSCRIPTION_PAYMENT | REFUND | ROLLBACK
  status         TransactionStatus @default(PENDING)
  amountCents    Int
  metadata       Json?
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  payment        Payment? @relation(fields: [paymentId], references: [id])

  @@index([organizationId, status])
}

// Idempotency ledger for Stripe webhooks — the row IS the idempotency key
model WebhookEvent {
  id          String   @id            // Stripe event.id, used as PK on purpose
  type        String
  payload     Json
  processedAt DateTime @default(now())
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   // never store raw token
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id])
  @@index([userId])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  usedAt    DateTime?

  user      User @relation(fields: [userId], references: [id])
  @@index([userId])
}

model Invite {
  id             String   @id @default(cuid())
  organizationId String
  email          String
  role           Role
  tokenHash      String
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  @@index([organizationId])
}

model NotificationLog {
  id             String   @id @default(cuid())
  organizationId String?
  userId         String?
  type           String   // MEMBER_INVITED | PAYMENT_SUCCESS | PAYMENT_FAILED | SUB_UPGRADED | ...
  channel        String   @default("email")
  status         String   // SENT | FAILED
  createdAt      DateTime @default(now())
}
```

## Indexing notes (performance criterion)

- `organizationId` indexed on every tenant-scoped table — it's the filter on every single tenant query.
- `Payment.stripePaymentIntentId` / `stripeCheckoutSessionId` unique — prevents duplicate payment rows even if webhook logic had a bug.
- `Transaction(organizationId, status)` composite index — powers the transaction-history filter UI directly.
- `Organization.status` indexed — platform admin org list filters by status.

## Why `organizationId` nullable only on `User`

Platform Admin is a real login but not scoped to any org. Modeling it as `organizationId: String?` (nullable) rather than a separate `PlatformAdmin` table keeps auth logic in one table/one code path — but every query that reads org-scoped `User` rows (e.g. "members list") must explicitly filter `role != PLATFORM_ADMIN` in addition to `organizationId`, or just query by `organizationId` (platform admins have none, so they never appear in a members list). Document this explicitly in the README as a deliberate tradeoff.
