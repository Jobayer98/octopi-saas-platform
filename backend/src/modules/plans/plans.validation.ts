import { z } from "zod";
import { BillingInterval } from "../../generated/prisma/enums.js";

export const createPlanSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().min(0),
  billingInterval: z.enum(BillingInterval),
  features: z.array(z.string()).min(1),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  features: z.array(z.string()).optional(),
});
