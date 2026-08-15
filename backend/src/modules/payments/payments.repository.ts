import { PrismaClient } from "../../generated/prisma/client.js";
import { paginate } from "../../common/utils/pagination.js";

export class PaymentsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrg(organizationId: string, page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.db.payment.findMany({
        where: { organizationId },
        ...paginate(page, limit),
        orderBy: { createdAt: "desc" },
        include: { subscription: { include: { plan: true } } },
      }),
      this.db.payment.count({ where: { organizationId } }),
    ]);
    return { data, total };
  }

  async findByCheckoutSession(sessionId: string) {
    return this.db.payment.findUnique({ where: { stripeCheckoutSessionId: sessionId } });
  }
}
