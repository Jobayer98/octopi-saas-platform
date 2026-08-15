import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { getTenantContext } from "../../context/tenant-context.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const TENANT_SCOPED_MODELS = new Set([
  "payment",
  "subscription",
  "transaction",
  "invite",
]);

function withTenantWhere(args: any, organizationId: string) {
  return { ...args, where: { ...args?.where, organizationId } };
}

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }: any) {
        const ctx = getTenantContext();
        if (ctx?.organizationId && TENANT_SCOPED_MODELS.has(model.toLowerCase()))
          args = withTenantWhere(args, ctx.organizationId);
        return query(args);
      },
      async findFirst({ model, args, query }: any) {
        const ctx = getTenantContext();
        if (ctx?.organizationId && TENANT_SCOPED_MODELS.has(model.toLowerCase()))
          args = withTenantWhere(args, ctx.organizationId);
        return query(args);
      },
    },
  },
});

export type PrismaExtended = typeof prisma;
