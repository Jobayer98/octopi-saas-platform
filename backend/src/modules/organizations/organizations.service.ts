import crypto from "crypto";
import { OrganizationsRepository } from "./organizations.repository.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { hashPassword } from "../../common/utils/hashing.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../common/errors/AppError.js";
import type { UpdateOrgProfileInput, InviteMemberInput, AcceptInviteInput } from "./organizations.types.js";
import { Role } from "../../generated/prisma/enums.js";

export class OrganizationsService {
  constructor(
    private readonly repo: OrganizationsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async getProfile(organizationId: string, role: Role) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found");

    // Strip financial/subscription data for non-admin roles
    if (role === Role.ORG_MEMBER) {
      const { subscriptions: _s, ...safe } = org;
      return safe;
    }
    return org;
  }

  async updateProfile(organizationId: string, input: UpdateOrgProfileInput) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found");
    return this.repo.updateProfile(organizationId, input);
  }

  async listMembers(organizationId: string) {
    return this.repo.findMembers(organizationId);
  }

  async inviteMember(organizationId: string, input: InviteMemberInput) {
    const org = await this.repo.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found");

    const existing = await this.repo.findPendingInviteByEmail(organizationId, input.email);
    if (existing) throw new ConflictError("An active invite already exists for this email");

    const rawToken = crypto.randomBytes(32).toString("hex");
    // SHA-256 (not bcrypt) so we can look up by hash without scanning all rows
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await this.repo.createInvite({
      organizationId,
      email: input.email,
      role: input.role,
      tokenHash,
      expiresAt,
    });

    await this.notifications.sendMemberInvite(input.email, org.name, rawToken, organizationId);
    return { message: "Invite sent" };
  }

  async acceptInvite(input: AcceptInviteInput) {
    const shaHash = crypto.createHash("sha256").update(input.token).digest("hex");
    const invite = await this.repo.findInviteByTokenHash(shaHash);
    if (!invite) throw new BadRequestError("Invalid or expired invite token");

    const passwordHash = await hashPassword(input.password);
    const user = await this.repo.createUserFromInvite({
      organizationId: invite.organizationId,
      email: invite.email,
      name: input.name,
      passwordHash,
      role: invite.role,
    });

    await this.repo.acceptInvite(invite.id);
    return { userId: user.id, organizationId: invite.organizationId };
  }

  async updateMemberRole(organizationId: string, userId: string, role: Role, requesterId: string) {
    if (userId === requesterId) throw new ForbiddenError("Cannot change your own role");
    const member = await this.repo.findMemberById(userId, organizationId);
    if (!member) throw new NotFoundError("Member not found");
    await this.repo.updateMemberRole(userId, organizationId, role);
    return { message: "Role updated" };
  }

  async removeMember(organizationId: string, userId: string, requesterId: string) {
    if (userId === requesterId) throw new ForbiddenError("Cannot remove yourself");
    const member = await this.repo.findMemberById(userId, organizationId);
    if (!member) throw new NotFoundError("Member not found");
    await this.repo.removeMember(userId, organizationId);
    return { message: "Member removed" };
  }
}
