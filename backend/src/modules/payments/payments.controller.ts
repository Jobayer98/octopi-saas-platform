import { Request, Response, NextFunction } from "express";
import { PaymentsService } from "./payments.service.js";
import { createCheckoutSchema } from "./payments.validation.js";
import { getTenantContext } from "../../context/tenant-context.js";
import { UnauthorizedError } from "../../common/errors/AppError.js";
import { parsePagination } from "../../common/utils/pagination.js";

export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = getTenantContext();
      if (!ctx?.organizationId) throw new UnauthorizedError();
      const { planId } = createCheckoutSchema.parse(req.body);
      const session = await this.service.createCheckoutSession(ctx.organizationId, planId, ctx.userId);
      res.status(201).json(session);
    } catch (err) { next(err); }
  }

  async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = getTenantContext();
      if (!ctx?.organizationId) throw new UnauthorizedError();
      res.json(await this.service.getCheckoutStatus(ctx.organizationId));
    } catch (err) { next(err); }
  }

  async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = getTenantContext();
      if (!ctx?.organizationId) throw new UnauthorizedError();
      const { page, limit } = parsePagination(req.query as Record<string, unknown>);
      res.json(await this.service.getPaymentHistory(ctx.organizationId, page, limit));
    } catch (err) { next(err); }
  }
}
