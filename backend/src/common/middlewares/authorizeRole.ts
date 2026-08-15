import { Request, Response, NextFunction } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { getTenantContext } from "../../context/tenant-context.js";

export function authorizeRole(...roles: Role[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const ctx = getTenantContext();
    if (!ctx) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(ctx.role)) {
      next(new ForbiddenError("Insufficient role"));
      return;
    }
    next();
  };
}
