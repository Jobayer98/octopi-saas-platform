import { Request, Response, NextFunction } from "express";
import { OrganizationsService } from "./organizations.service.js";
import {
  updateOrgProfileSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  updateMemberRoleSchema,
} from "./organizations.validation.js";
import { getTenantContext } from "../../context/tenant-context.js";
import { UnauthorizedError } from "../../common/errors/AppError.js";

export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  private ctx() {
    const ctx = getTenantContext();
    if (!ctx) throw new UnauthorizedError();
    return ctx;
  }

  async getProfile(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = this.ctx();
      res.json(await this.service.getProfile(ctx.organizationId!, ctx.role));
    } catch (err) { next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = this.ctx();
      const input = updateOrgProfileSchema.parse(req.body);
      res.json(await this.service.updateProfile(ctx.organizationId!, input));
    } catch (err) { next(err); }
  }

  async listMembers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = this.ctx();
      res.json(await this.service.listMembers(ctx.organizationId!));
    } catch (err) { next(err); }
  }

  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = this.ctx();
      const input = inviteMemberSchema.parse(req.body);
      res.status(201).json(await this.service.inviteMember(ctx.organizationId!, input));
    } catch (err) { next(err); }
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = acceptInviteSchema.parse(req.body);
      res.status(201).json(await this.service.acceptInvite(input));
    } catch (err) { next(err); }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = this.ctx();
      const { role } = updateMemberRoleSchema.parse(req.body);
      res.json(await this.service.updateMemberRole(ctx.organizationId!, String(req.params["userId"]), role, ctx.userId));
    } catch (err) { next(err); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = this.ctx();
      res.json(await this.service.removeMember(ctx.organizationId!, String(req.params["userId"]), ctx.userId));
    } catch (err) { next(err); }
  }
}
