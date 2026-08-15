import { TransactionsRepository } from "./transactions.repository.js";
import { TransactionStatus } from "../../generated/prisma/enums.js";
import { buildPaginatedResult } from "../../common/utils/pagination.js";

export class TransactionsService {
  constructor(private readonly repo: TransactionsRepository) {}

  async getOrgTransactions(
    organizationId: string,
    filter: { status?: TransactionStatus; page: number; limit: number },
  ) {
    const { data, total } = await this.repo.findByOrg(organizationId, filter);
    return buildPaginatedResult(data, total, filter);
  }

  async getAllTransactions(filter: {
    organizationId?: string;
    status?: TransactionStatus;
    page: number;
    limit: number;
  }) {
    const { data, total } = await this.repo.findAll(filter);
    return buildPaginatedResult(data, total, filter);
  }
}
