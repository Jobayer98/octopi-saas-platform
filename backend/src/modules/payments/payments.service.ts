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
    planId: string | undefined,
    userId: string,
  ) {
    // If no planId provided, fall back to the org's latest pending subscription
    const resolvedPlanId = planId ?? (
      await this.subsRepo.findLatestByOrg(organizationId)
    )?.planId;
    if (!resolvedPlanId) throw new BadRequestError("planId is required");

    const plan = await this.subsRepo.findPlanById(resolvedPlanId);
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
      planId: resolvedPlanId,
      planName: plan.name,
      priceCents: plan.priceCents,
      currency: "inr",
      successUrl: `${env.FRONTEND_URL}/checkout/${organizationId}?status=success`,
      cancelUrl: `${env.FRONTEND_URL}/checkout/${organizationId}?status=cancel`,
      customerEmail,
    });

    return session;
  }

  async getCheckoutStatus(organizationId: string) {
    const [org, sub] = await Promise.all([
      prisma.organization.findUnique({ where: { id: organizationId }, select: { status: true } }),
      this.subsRepo.findLatestByOrg(organizationId),
    ]);
    return { organizationId, orgStatus: org?.status ?? "PENDING_PAYMENT", subscription: sub };
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
