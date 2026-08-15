import { PrismaClient, OrgStatus } from "../../generated/prisma/client.js";
import { paginate } from "../../common/utils/pagination.js";

export class PlatformRepository {
  constructor(private readonly db: PrismaClient) {}

  async getStats() {
    const [totalOrgs, activeOrgs, totalUsers, activeSubscriptions, revenueAgg, failedPayments] =
      await Promise.all([
        this.db.organization.count(),
        this.db.organization.count({ where: { status: OrgStatus.ACTIVE } }),
        this.db.user.count({ where: { status: "ACTIVE" } }),
        this.db.subscription.count({ where: { status: "ACTIVE" } }),
        this.db.payment.aggregate({
          _sum: { amountCents: true },
          where: { status: "SUCCESS" },
        }),
        this.db.payment.count({ where: { status: "FAILED" } }),
      ]);

    return {
      totalOrgs,
      activeOrgs,
      totalUsers,
      activeSubscriptions,
      totalRevenueCents: revenueAgg._sum.amountCents ?? 0,
      failedPayments,
    };
  }

  async findAllOrgs(filter: {
    status?: OrgStatus;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" as const } },
              { billingEmail: { contains: filter.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        ...paginate(filter.page, filter.limit),
        orderBy: { createdAt: "desc" },
        include: {
          subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
          _count: { select: { users: true } },
        },
      }),
      this.db.organization.count({ where }),
    ]);

    return { data, total };
  }

  async findOrgById(id: string) {
    return this.db.organization.findUnique({
      where: { id },
      include: {
        users: { where: { status: "ACTIVE" }, select: { id: true, email: true, name: true, role: true, createdAt: true } },
        subscriptions: { orderBy: { createdAt: "desc" }, include: { plan: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }

  async updateOrgStatus(id: string, status: OrgStatus) {
    return this.db.organization.update({ where: { id }, data: { status } });
  }
}
