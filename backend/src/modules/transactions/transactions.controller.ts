import { Request, Response, NextFunction } from "express";
import { TransactionsService } from "./transactions.service.js";
import { txFilterSchema } from "./transactions.validation.js";
import { getTenantContext } from "../../context/tenant-context.js";
import { UnauthorizedError } from "../../common/errors/AppError.js";

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  async getOrgTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = getTenantContext();
      if (!ctx?.organizationId) throw new UnauthorizedError();
      const { status, page, limit } = txFilterSchema.parse(req.query);
      res.json(await this.service.getOrgTransactions(ctx.organizationId, { status, page, limit }));
    } catch (err) { next(err); }
  }

  async getAllTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, organizationId, page, limit } = txFilterSchema.parse(req.query);
      res.json(await this.service.getAllTransactions({ status, organizationId, page, limit }));
    } catch (err) { next(err); }
  }
}
