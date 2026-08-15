import { SubscriptionsRepository } from "./subscriptions.repository.js";
import { PlansRepository } from "../plans/plans.repository.js";
import type { PaymentProvider } from "../payments/providers/payment-provider.interface.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import {
  BadRequestError,
  NotFoundError,
} from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";

export class SubscriptionsService {
  constructor(
    private readonly repo: SubscriptionsRepository,
    private readonly plansRepo: PlansRepository,
    private readonly paymentProvider: PaymentProvider,
    private readonly notifications: NotificationsService,
  ) {}

  async getSubscription(organizationId: string) {
    const sub = await this.repo.findLatestByOrg(organizationId);
    if (!sub) throw new NotFoundError("No subscription found");
    return sub;
  }

  async createUpgradeSession(
    organizationId: string,
    planId: string,
    customerEmail: string,
  ) {
    const plan = await this.plansRepo.findById(planId);
    if (!plan || !plan.isActive)
      throw new BadRequestError("Invalid or inactive plan");

    const session = await this.paymentProvider.createCheckoutSession({
      organizationId,
      planId,
      planName: plan.name,
      priceCents: plan.priceCents,
      currency: "inr",
      successUrl: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${env.FRONTEND_URL}/org/subscription`,
      customerEmail,
    });

    return session;
  }

  async cancelSubscription(
    organizationId: string,
    billingEmail: string,
    orgName: string,
  ) {
    const sub = await this.repo.findActiveByOrg(organizationId);
    if (!sub) throw new NotFoundError("No active subscription to cancel");

    await this.repo.cancelSubscription(organizationId, sub.id);
    await this.notifications.sendSubscriptionEvent(
      billingEmail,
      orgName,
      "SUB_CANCELLED",
      organizationId,
    );
    return { message: "Subscription cancelled" };
  }
}
