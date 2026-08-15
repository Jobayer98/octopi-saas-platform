import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { tenantStorage } from "../../context/tenant-context.js";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing access token"));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    // Store in AsyncLocalStorage so Prisma middleware and services can read it
    tenantStorage.run(
      { userId: payload.sub, organizationId: payload.organizationId, role: payload.role },
      () => next(),
    );
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}
