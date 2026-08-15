import { PrismaClient, TransactionStatus } from "../../generated/prisma/client.js";
import { paginate } from "../../common/utils/pagination.js";

export class TransactionsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrg(
    organizationId: string,
    filter: { status?: TransactionStatus; page: number; limit: number },
  ) {
    const where = {
      organizationId,
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.transaction.findMany({
        where,
        ...paginate(filter.page, filter.limit),
        orderBy: { createdAt: "desc" },
        include: { payment: true },
      }),
      this.db.transaction.count({ where }),
    ]);

    return { data, total };
  }

  async findAll(filter: {
    organizationId?: string;
    status?: TransactionStatus;
    page: number;
    limit: number;
  }) {
    const where = {
      ...(filter.organizationId ? { organizationId: filter.organizationId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.transaction.findMany({
        where,
        ...paginate(filter.page, filter.limit),
        orderBy: { createdAt: "desc" },
        include: { organization: { select: { id: true, name: true } }, payment: true },
      }),
      this.db.transaction.count({ where }),
    ]);

    return { data, total };
  }
}
