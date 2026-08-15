import { Role } from "../../generated/prisma/enums.js";

export interface OrgListFilter {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface UpdateOrgProfileInput {
  name?: string;
  billingEmail?: string;
  contactInfo?: Record<string, unknown>;
}

export interface InviteMemberInput {
  email: string;
  role: Role;
}

export interface AcceptInviteInput {
  token: string;
  name: string;
  password: string;
}
