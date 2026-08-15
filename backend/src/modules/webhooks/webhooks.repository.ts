import type { PrismaExtended } from "../../common/lib/prisma.js";

export class WebhooksRepository {
  constructor(private readonly db: PrismaExtended) {}

  async processCheckoutCompleted(data: {
    stripeEventId: string;
    eventType: string;
    payload: unknown;
    organizationId: string;
    subscriptionId: string;
    planId: string;
    amountCents: number;
    currency: string;
    stripeSessionId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    return this.db.$transaction(async (tx) => {
      // 1. Insert WebhookEvent — this IS the idempotency key (PK constraint will throw on duplicate)
      await tx.webhookEvent.create({
        data: {
          id: data.stripeEventId,
          type: data.eventType,
          payload: data.payload as never,
        },
      });

      // 2. Activate org
      await tx.organization.update({
        where: { id: data.organizationId },
        data: { status: "ACTIVE" },
      });

      // 3. Upsert subscription to ACTIVE
      await tx.subscription.update({
        where: { id: data.subscriptionId },
        data: {
          status: "ACTIVE",
          planId: data.planId,
          currentPeriodStart: data.periodStart,
          currentPeriodEnd: data.periodEnd,
        },
      });

      // 4. Create Payment (SUCCESS)
      const payment = await tx.payment.create({
        data: {
          organizationId: data.organizationId,
          subscriptionId: data.subscriptionId,
          amountCents: data.amountCents,
          currency: data.currency,
          status: "SUCCESS",
          stripeCheckoutSessionId: data.stripeSessionId,
        },
      });

      // 5. Create Transaction (SUCCESS)
      await tx.transaction.create({
        data: {
          organizationId: data.organizationId,
          paymentId: payment.id,
          type: "SUBSCRIPTION_PAYMENT",
          status: "SUCCESS",
          amountCents: data.amountCents,
        },
      });

      return payment;
    });
  }

  async processCheckoutFailed(data: {
    stripeEventId: string;
    eventType: string;
    payload: unknown;
    organizationId: string;
    subscriptionId: string;
    amountCents: number;
    currency: string;
    stripeSessionId: string;
    failureReason?: string;
  }) {
    return this.db.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          id: data.stripeEventId,
          type: data.eventType,
          payload: data.payload as never,
        },
      });

      const payment = await tx.payment.create({
        data: {
          organizationId: data.organizationId,
          subscriptionId: data.subscriptionId,
          amountCents: data.amountCents,
          currency: data.currency,
          status: "FAILED",
          stripeCheckoutSessionId: data.stripeSessionId,
          failureReason: data.failureReason,
        },
      });

      await tx.transaction.create({
        data: {
          organizationId: data.organizationId,
          paymentId: payment.id,
          type: "SUBSCRIPTION_PAYMENT",
          status: "FAILED",
          amountCents: data.amountCents,
        },
      });

      return payment;
    });
  }

  async webhookEventExists(id: string): Promise<boolean> {
    const event = await this.db.webhookEvent.findUnique({ where: { id } });
    return event !== null;
  }

  async findOrgSubscription(organizationId: string) {
    return this.db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { organization: true },
    });
  }
}
