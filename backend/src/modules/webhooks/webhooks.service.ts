import { WebhooksRepository } from "./webhooks.repository.js";
import type { PaymentProvider } from "../payments/providers/payment-provider.interface.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { BadRequestError } from "../../common/errors/AppError.js";

export class WebhooksService {
  constructor(
    private readonly repo: WebhooksRepository,
    private readonly paymentProvider: PaymentProvider,
    private readonly notifications: NotificationsService,
  ) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // 1. Verify signature — throws if invalid
    let event: ReturnType<PaymentProvider["verifyWebhookSignature"]>;
    try {
      event = this.paymentProvider.verifyWebhookSignature(rawBody, signature);
    } catch {
      throw new BadRequestError("Invalid webhook signature");
    }

    const stripeEvent = event as { id: string; type: string; data: { object: Record<string, unknown> } };

    // 2. Idempotency check — if already processed, short-circuit
    const alreadyProcessed = await this.repo.webhookEventExists(stripeEvent.id);
    if (alreadyProcessed) return;

    const session = stripeEvent.data.object;

    switch (stripeEvent.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(stripeEvent.id, stripeEvent.type, session);
        break;
      case "checkout.session.expired":
        await this.handleCheckoutFailed(stripeEvent.id, stripeEvent.type, session, "Session expired");
        break;
      default:
        // Unhandled event types — record and ignore
        break;
    }
  }

  private async handleCheckoutCompleted(
    eventId: string,
    eventType: string,
    session: Record<string, unknown>,
  ): Promise<void> {
    const organizationId = (session.metadata as Record<string, string>)?.organizationId;
    const planId = (session.metadata as Record<string, string>)?.planId;
    if (!organizationId || !planId) return;

    const sub = await this.repo.findOrgSubscription(organizationId);
    if (!sub) return;

    const amountCents = (session.amount_total as number) ?? 0;
    const currency = (session.currency as string) ?? "usd";
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.repo.processCheckoutCompleted({
      stripeEventId: eventId,
      eventType,
      payload: session,
      organizationId,
      subscriptionId: sub.id,
      planId,
      amountCents,
      currency,
      stripeSessionId: session.id as string,
      periodStart: now,
      periodEnd,
    });

    // Post-commit notification (non-fatal)
    await this.notifications.sendPaymentSuccess(
      sub.organization.billingEmail,
      sub.organization.name,
      amountCents,
      organizationId,
    );
  }

  private async handleCheckoutFailed(
    eventId: string,
    eventType: string,
    session: Record<string, unknown>,
    reason: string,
  ): Promise<void> {
    const organizationId = (session.metadata as Record<string, string>)?.organizationId;
    if (!organizationId) return;

    const sub = await this.repo.findOrgSubscription(organizationId);
    if (!sub) return;

    await this.repo.processCheckoutFailed({
      stripeEventId: eventId,
      eventType,
      payload: session,
      organizationId,
      subscriptionId: sub.id,
      amountCents: (session.amount_total as number) ?? 0,
      currency: (session.currency as string) ?? "usd",
      stripeSessionId: session.id as string,
      failureReason: reason,
    });

    await this.notifications.sendPaymentFailed(
      sub.organization.billingEmail,
      sub.organization.name,
      organizationId,
    );
  }
}
