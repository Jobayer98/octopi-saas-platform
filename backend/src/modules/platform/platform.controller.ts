import { Request, Response, NextFunction } from "express";
import { PlatformService } from "./platform.service.js";
import { orgListQuerySchema } from "./platform.validation.js";

export class PlatformController {
  constructor(private readonly service: PlatformService) {}

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await this.service.getStats());
    } catch (err) { next(err); }
  }

  async listOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, page, limit } = orgListQuerySchema.parse(req.query);
      res.json(await this.service.listOrgs({ status, search, page, limit }));
    } catch (err) { next(err); }
  }

  async getOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await this.service.getOrg(String(req.params["id"])));
    } catch (err) { next(err); }
  }

  async suspendOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await this.service.suspendOrg(String(req.params["id"])));
    } catch (err) { next(err); }
  }

  async reactivateOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await this.service.reactivateOrg(String(req.params["id"])));
    } catch (err) { next(err); }
  }
}
