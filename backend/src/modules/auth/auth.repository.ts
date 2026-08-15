import type { PrismaExtended } from "../../common/lib/prisma.js";
import { Role, OrgStatus } from "../../generated/prisma/enums.js";

export class AuthRepository {
  constructor(private readonly db: PrismaExtended) {}

  async findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: { organization: { select: { id: true, name: true, status: true } } },
    });
  }

  async findUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { organization: { select: { id: true, name: true, status: true } } },
    });
  }

  async createOrgAndAdmin(input: {
    orgName: string;
    billingEmail: string;
    adminName: string;
    adminEmail: string;
    passwordHash: string;
    planId: string;
  }) {
    return this.db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.orgName,
          billingEmail: input.billingEmail,
          status: OrgStatus.PENDING_PAYMENT,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: input.adminEmail,
          passwordHash: input.passwordHash,
          name: input.adminName,
          role: Role.ORG_ADMIN,
        },
      });

      // Create a pending subscription so the checkout session has a planId reference
      const subscription = await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: input.planId,
          status: "PENDING",
        },
      });

      return { org, user, subscription };
    });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.db.refreshToken.create({ data });
  }

  async findRefreshToken(id: string) {
    return this.db.refreshToken.findUnique({ where: { id } });
  }

  async revokeRefreshToken(id: string) {
    return this.db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.db.passwordResetToken.create({ data });
  }

  async findValidPasswordResetToken(userId: string) {
    return this.db.passwordResetToken.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async markPasswordResetTokenUsed(id: string) {
    return this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    return this.db.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async findPlanById(planId: string) {
    return this.db.plan.findUnique({ where: { id: planId } });
  }
}
