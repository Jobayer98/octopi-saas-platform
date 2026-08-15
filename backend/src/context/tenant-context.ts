import { AsyncLocalStorage } from "async_hooks";
import { Role } from "../generated/prisma/enums.js";

export interface TenantContext {
  userId: string;
  organizationId: string | null;
  role: Role;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}
