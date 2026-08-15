import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { getTenantContext } from "../../context/tenant-context.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });

// Defense-in-depth: auto-inject organizationId on tenant-scoped models
// if a tenant context is active. The repository layer is the primary enforcement;
// this is a second independent guard that catches any future slip.
// Note: $use is available in Prisma v4/v5 via the middleware API.
const TENANT_SCOPED_MODELS = new Set([
  "payment",
  "subscription",
  "transaction",
  "invite",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$use(async (params: any, next: any) => {
  const ctx = getTenantContext();
  if (!ctx?.organizationId) return next(params);

  const model = params.model?.toLowerCase();
  if (!model || !TENANT_SCOPED_MODELS.has(model)) return next(params);

  if (params.action === "findMany" || params.action === "findFirst") {
    params.args ??= {};
    params.args.where = {
      ...params.args.where,
      organizationId: ctx.organizationId,
    };
  }

  return next(params);
});
