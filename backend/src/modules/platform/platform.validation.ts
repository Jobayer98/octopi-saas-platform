import { z } from "zod";
import { OrgStatus } from "../../generated/prisma/enums.js";
import { paginationSchema } from "../../common/validation/base.schemas.js";

export const orgListQuerySchema = paginationSchema.extend({
  status: z.enum(OrgStatus).optional(),
  search: z.string().optional(),
});
