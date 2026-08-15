import { PaymentsRepository } from "./payments.repository.js";
import { SubscriptionsRepository } from "../subscriptions/subscriptions.repository.js";
import type { PaymentProvider } from "./providers/payment-provider.interface.js";
import { BadRequestError } from "../../common/errors/AppError.js";
import { buildPaginatedResult } from "../../common/utils/pagination.js";
import { env } from "../../config/env.js";
import { prisma } from "../../common/lib/prisma.js";

export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly subsRepo: SubscriptionsRepository,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async createCheckoutSession(
    organizationId: string,
    planId: string,
    userId: string,
  ) {
    const plan = await this.subsRepo.findPlanById(planId);
    if (!plan || !plan.isActive)
      throw new BadRequestError("Invalid or inactive plan");

    // Fetch email from DB — never trust body for this
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const customerEmail = user?.email ?? "";

    const session = await this.paymentProvider.createCheckoutSession({
      organizationId,
      planId,
      planName: plan.name,
      priceCents: plan.priceCents,
      currency: "inr",
      successUrl: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${env.FRONTEND_URL}/checkout/cancel`,
      customerEmail,
    });

    return session;
  }

  async getCheckoutStatus(organizationId: string) {
    const sub = await this.subsRepo.findActiveByOrg(organizationId);
    return { organizationId, subscription: sub };
  }

  async getPaymentHistory(organizationId: string, page: number, limit: number) {
    const { data, total } = await this.repo.findByOrg(
      organizationId,
      page,
      limit,
    );
    return buildPaginatedResult(data, total, { page, limit });
  }
}
