import crypto from "crypto";
import { AuthRepository } from "./auth.repository.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  verifyToken,
} from "../../common/utils/hashing.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../common/errors/AppError.js";
import type { RegisterInput, LoginInput, AuthTokens, MeResponse } from "./auth.types.js";
import { prisma } from "../../common/lib/prisma.js";

export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async register(input: RegisterInput): Promise<{ orgId: string; userId: string }> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) throw new ConflictError("Email already in use");

    const plan = await this.repo.findPlanById(input.planId);
    if (!plan || !plan.isActive) throw new BadRequestError("Invalid or inactive plan");

    const passwordHash = await hashPassword(input.password);
    const { org, user } = await this.repo.createOrgAndAdmin({
      orgName: input.orgName,
      billingEmail: input.billingEmail,
      adminName: input.name,
      adminEmail: input.email,
      passwordHash,
      planId: input.planId,
    });

    return { orgId: org.id, userId: user.id };
  }

  async login(input: LoginInput): Promise<AuthTokens & { user: MeResponse }> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    if (user.status === "REMOVED") throw new UnauthorizedError("Account is deactivated");

    const tokens = await this.issueTokens(user.id, user.organizationId, user.role);
    return { ...tokens, user: this.toMeResponse(user) };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const stored = await this.repo.findRefreshToken(payload.jti);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expired or revoked");
    }

    const valid = await verifyToken(rawRefreshToken, stored.tokenHash);
    if (!valid) throw new UnauthorizedError("Invalid refresh token");

    // Rotate: revoke old, issue new
    await this.repo.revokeRefreshToken(stored.id);

    const user = await this.repo.findUserById(stored.userId);
    if (!user) throw new UnauthorizedError("User not found");

    return this.issueTokens(user.id, user.organizationId, user.role);
  }

  async logout(refreshTokenId: string): Promise<void> {
    await this.repo.revokeRefreshToken(refreshTokenId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.repo.findUserByEmail(email);
    // Always succeed — prevents email enumeration
    if (!user) return;

    const randomPart = crypto.randomBytes(32).toString("hex");
    // Token format: `userId.randomHex` — userId prefix lets us look up the record on reset
    const rawToken = `${user.id}.${randomPart}`;
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.repo.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });
    await this.notifications.sendPasswordReset(user.email, user.name, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const dotIndex = rawToken.indexOf(".");
    if (dotIndex === -1) throw new BadRequestError("Invalid reset token");

    const userId = rawToken.slice(0, dotIndex);
    const tokenRecord = await this.repo.findValidPasswordResetToken(userId);
    if (!tokenRecord) throw new BadRequestError("Invalid or expired reset token");

    const valid = await verifyToken(rawToken, tokenRecord.tokenHash);
    if (!valid) throw new BadRequestError("Invalid or expired reset token");

    const passwordHash = await hashPassword(newPassword);
    await this.repo.updateUserPassword(userId, passwordHash);
    await this.repo.markPasswordResetTokenUsed(tokenRecord.id);
    // Invalidate all sessions on password reset
    await this.repo.revokeAllUserRefreshTokens(userId);
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundError("User not found");
    return this.toMeResponse(user);
  }

  private async issueTokens(
    userId: string,
    organizationId: string | null,
    role: string,
  ): Promise<AuthTokens> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create record with placeholder hash to get the id (used as jti in the token)
    const record = await this.repo.createRefreshToken({
      userId,
      tokenHash: "placeholder",
      expiresAt,
    });

    const accessToken = signAccessToken({
      sub: userId,
      role: role as never,
      organizationId,
    });

    // jti = record.id so we can look up and revoke by id
    const refreshToken = signRefreshToken({ sub: userId, jti: record.id });
    const tokenHash = await hashToken(refreshToken);

    // Update with real hash now that we have the signed token
    await prisma.refreshToken.update({ where: { id: record.id }, data: { tokenHash } });

    return { accessToken, refreshToken, refreshTokenId: record.id };
  }

  private toMeResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string | null;
    organization: { id: string; name: string; status: string } | null;
  }): MeResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as never,
      organizationId: user.organizationId,
      organization: user.organization,
    };
  }
}
