import { Request, Response, NextFunction } from "express";
import { SubscriptionsService } from "./subscriptions.service.js";
import { upgradePlanSchema } from "./subscriptions.validation.js";
import { getTenantContext } from "../../context/tenant-context.js";
import { UnauthorizedError } from "../../common/errors/AppError.js";
import { prisma } from "../../common/lib/prisma.js";

export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  private ctx() {
    const ctx = getTenantContext();
    if (!ctx?.organizationId) throw new UnauthorizedError();
    return ctx;
  }

  getSubscription = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = this.ctx();
      res.json(await this.service.getSubscription(ctx.organizationId!));
    } catch (err) { next(err); }
  };

  upgrade = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = this.ctx();
      const { planId } = upgradePlanSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { email: true } });
      res.status(201).json(
        await this.service.createUpgradeSession(ctx.organizationId!, planId, user?.email ?? "")
      );
    } catch (err) { next(err); }
  };

  cancel = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = this.ctx();
      const org = await prisma.organization.findUnique({
        where: { id: ctx.organizationId! },
        select: { billingEmail: true, name: true },
      });
      res.json(
        await this.service.cancelSubscription(ctx.organizationId!, org?.billingEmail ?? "", org?.name ?? "")
      );
    } catch (err) { next(err); }
  };
}
