import { PrismaClient } from "../../generated/prisma/client.js";

export class SubscriptionsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActiveByOrg(organizationId: string) {
    return this.db.subscription.findFirst({
      where: { organizationId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
  }

  async findLatestByOrg(organizationId: string) {
    return this.db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
  }

  async findPlanById(planId: string) {
    return this.db.plan.findUnique({ where: { id: planId } });
  }

  async cancelSubscription(organizationId: string, subscriptionId: string) {
    return this.db.subscription.updateMany({
      where: { id: subscriptionId, organizationId },
      data: { status: "CANCELLED" },
    });
  }
}
