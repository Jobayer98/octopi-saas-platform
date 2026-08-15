import { z } from "zod";

export const upgradePlanSchema = z.object({
  planId: z.string().min(1),
});
