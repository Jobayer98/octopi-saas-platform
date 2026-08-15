import { z } from "zod";

export const createCheckoutSchema = z.object({
  planId: z.string().min(1).optional(),
});
