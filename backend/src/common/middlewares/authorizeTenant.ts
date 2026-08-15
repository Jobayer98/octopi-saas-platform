import { Request, Response, NextFunction } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { getTenantContext } from "../../context/tenant-context.js";

// Confirms the authenticated user belongs to the org they're operating on.
// PLATFORM_ADMIN is exempt — they can access any org.
// organizationId is ALWAYS derived from the token, never from req.body.
export function authorizeTenant(_req: Request, _res: Response, next: NextFunction): void {
  const ctx = getTenantContext();
  if (!ctx) {
    next(new UnauthorizedError());
    return;
  }
  if (ctx.role === Role.PLATFORM_ADMIN) {
    next();
    return;
  }
  if (!ctx.organizationId) {
    next(new ForbiddenError("No organization associated with this account"));
    return;
  }
  next();
}
