import { z } from "zod";
import { OrgStatus } from "../../generated/prisma/enums.js";
import {
  paginationSchema,
  emailSchema,
  passwordSchema,
} from "../../common/validation/base.schemas.js";

export const orgListQuerySchema = paginationSchema.extend({
  status: z.enum(OrgStatus).optional(),
  search: z.string().optional(),
});

export const updateOrgProfileSchema = z.object({
  name: z.string().min(2).optional(),
  billingEmail: z.email().optional(),
  contactInfo: z.record(z.string(), z.string()).optional(),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["ORG_ADMIN", "ORG_MEMBER"]),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2),
  password: passwordSchema,
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ORG_ADMIN", "ORG_MEMBER"]),
});
