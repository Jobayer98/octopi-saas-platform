import type { PrismaExtended } from "../../common/lib/prisma.js";
import { OrgStatus } from "../../generated/prisma/client.js";
import type { UpdateOrgProfileInput } from "./organizations.types.js";
import { paginate } from "../../common/utils/pagination.js";

export class OrganizationsRepository {
  constructor(private readonly db: PrismaExtended) {}

  async findById(id: string) {
    return this.db.organization.findUnique({
      where: { id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });
  }

  async findAll(filter: {
    status?: OrgStatus;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" as const } },
              { billingEmail: { contains: filter.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        ...paginate(filter.page, filter.limit),
        orderBy: { createdAt: "desc" },
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { plan: true },
          },
          _count: { select: { users: true } },
        },
      }),
      this.db.organization.count({ where }),
    ]);

    return { data, total };
  }

  async updateProfile(id: string, input: UpdateOrgProfileInput) {
    return this.db.organization.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.billingEmail !== undefined ? { billingEmail: input.billingEmail } : {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(input.contactInfo !== undefined ? { contactInfo: input.contactInfo as any } : {}),
      },
    });
  }

  async updateStatus(id: string, status: OrgStatus) {
    return this.db.organization.update({ where: { id }, data: { status } });
  }

  async findMembers(organizationId: string) {
    return this.db.user.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findMemberById(userId: string, organizationId: string) {
    return this.db.user.findFirst({
      where: { id: userId, organizationId },
    });
  }

  async updateMemberRole(userId: string, organizationId: string, role: string) {
    return this.db.user.updateMany({
      where: { id: userId, organizationId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { role: role as any },
    });
  }

  async removeMember(userId: string, organizationId: string) {
    return this.db.user.updateMany({
      where: { id: userId, organizationId },
      data: { status: "REMOVED" },
    });
  }

  async createInvite(data: {
    organizationId: string;
    email: string;
    role: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.invite.create({ data: data as any });
  }

  async findInviteByTokenHash(tokenHash: string) {
    return this.db.invite.findFirst({
      where: { tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { organization: true },
    });
  }

  async findPendingInviteByEmail(organizationId: string, email: string) {
    return this.db.invite.findFirst({
      where: { organizationId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async acceptInvite(inviteId: string) {
    return this.db.invite.update({
      where: { id: inviteId },
      data: { acceptedAt: new Date() },
    });
  }

  async createUserFromInvite(data: {
    organizationId: string;
    email: string;
    name: string;
    passwordHash: string;
    role: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.user.create({ data: data as any });
  }
}
