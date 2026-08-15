import { BillingInterval } from "../../generated/prisma/enums.js";

export interface CreatePlanInput {
  name: string;
  priceCents: number;
  billingInterval: BillingInterval;
  features: string[];
}

export interface UpdatePlanInput {
  name?: string;
  priceCents?: number;
  features?: string[];
}
