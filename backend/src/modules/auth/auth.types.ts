import { Role } from "../../generated/prisma/enums.js";

export interface RegisterInput {
  orgName: string;
  billingEmail: string;
  name: string;
  email: string;
  password: string;
  planId: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
  organization: { id: string; name: string; status: string } | null;
}
