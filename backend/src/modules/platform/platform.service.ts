import { PlatformRepository } from "./platform.repository.js";
import { OrgStatus } from "../../generated/prisma/enums.js";
import { NotFoundError } from "../../common/errors/AppError.js";
import { buildPaginatedResult } from "../../common/utils/pagination.js";

export class PlatformService {
  constructor(private readonly repo: PlatformRepository) {}

  async getStats() {
    return this.repo.getStats();
  }

  async listOrgs(filter: { status?: OrgStatus; search?: string; page: number; limit: number }) {
    const { data, total } = await this.repo.findAllOrgs(filter);
    return buildPaginatedResult(data, total, filter);
  }

  async getOrg(id: string) {
    const org = await this.repo.findOrgById(id);
    if (!org) throw new NotFoundError("Organization not found");
    return org;
  }

  async suspendOrg(id: string) {
    const org = await this.repo.findOrgById(id);
    if (!org) throw new NotFoundError("Organization not found");
    return this.repo.updateOrgStatus(id, OrgStatus.SUSPENDED);
  }

  async reactivateOrg(id: string) {
    const org = await this.repo.findOrgById(id);
    if (!org) throw new NotFoundError("Organization not found");
    return this.repo.updateOrgStatus(id, OrgStatus.ACTIVE);
  }
}
