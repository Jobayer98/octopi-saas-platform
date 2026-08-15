import { z } from "zod";
import { TransactionStatus } from "../../generated/prisma/enums.js";
import { paginationSchema } from "../../common/validation/base.schemas.js";

export const txFilterSchema = paginationSchema.extend({
  status: z.enum(TransactionStatus).optional(),
  organizationId: z.string().optional(),
});
