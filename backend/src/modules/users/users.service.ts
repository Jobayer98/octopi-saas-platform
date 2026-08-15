import { UsersRepository } from "./users.repository.js";
import { OrganizationsRepository } from "../organizations/organizations.repository.js";
import { hashPassword, verifyPassword } from "../../common/utils/hashing.js";
import { NotFoundError, UnauthorizedError } from "../../common/errors/AppError.js";
import type { UpdateProfileInput, ChangePasswordInput } from "./users.types.js";
import { Role } from "../../generated/prisma/enums.js";

export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly orgsRepo: OrganizationsRepository,
  ) {}

  async getProfile(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const { passwordHash: _p, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const updated = await this.repo.updateProfile(userId, input);
    const { passwordHash: _p, ...safe } = updated;
    return safe;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Current password is incorrect");

    const passwordHash = await hashPassword(input.newPassword);
    await this.repo.updatePassword(userId, passwordHash);
    return { message: "Password updated" };
  }

  async getOrgInfo(organizationId: string, role: Role) {
    const org = await this.orgsRepo.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found");

    // Members only see basic info — no financial data
    if (role === Role.ORG_MEMBER) {
      const { subscriptions: _s, ...safe } = org;
      return safe;
    }
    return org;
  }
}
