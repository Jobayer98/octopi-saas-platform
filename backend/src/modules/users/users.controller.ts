import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service.js";
import { updateProfileSchema, changePasswordSchema } from "./users.validation.js";
import { getTenantContext } from "../../context/tenant-context.js";
import { UnauthorizedError } from "../../common/errors/AppError.js";

export class UsersController {
  constructor(private readonly service: UsersService) {}

  private ctx() {
    const ctx = getTenantContext();
    if (!ctx) throw new UnauthorizedError();
    return ctx;
  }

  async getProfile(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await this.service.getProfile(this.ctx().userId));
    } catch (err) { next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateProfileSchema.parse(req.body);
      res.json(await this.service.updateProfile(this.ctx().userId, input));
    } catch (err) { next(err); }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = changePasswordSchema.parse(req.body);
      res.json(await this.service.changePassword(this.ctx().userId, input));
    } catch (err) { next(err); }
  }
}
