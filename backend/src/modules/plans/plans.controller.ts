import { Request, Response, NextFunction } from "express";
import { PlansService } from "./plans.service.js";
import { createPlanSchema, updatePlanSchema } from "./plans.validation.js";

export class PlansController {
  constructor(private readonly service: PlansService) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query["activeOnly"] === "true";
      res.json(await this.service.listPlans(activeOnly));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createPlanSchema.parse(req.body);
      res.status(201).json(await this.service.createPlan(input));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updatePlanSchema.parse(req.body);
      res.json(await this.service.updatePlan(String(req.params["id"]), input));
    } catch (err) { next(err); }
  }

  async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await this.service.disablePlan(String(req.params["id"])));
    } catch (err) { next(err); }
  }
}
