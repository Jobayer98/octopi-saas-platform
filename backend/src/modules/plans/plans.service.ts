import { PlansRepository } from "./plans.repository.js";
import { NotFoundError } from "../../common/errors/AppError.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plans.types.js";

export class PlansService {
  constructor(private readonly repo: PlansRepository) {}

  async listPlans(activeOnly = false) {
    return this.repo.findAll(activeOnly);
  }

  async createPlan(input: CreatePlanInput) {
    return this.repo.create(input);
  }

  async updatePlan(id: string, input: UpdatePlanInput) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    return this.repo.update(id, input);
  }

  async disablePlan(id: string) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundError("Plan not found");
    return this.repo.disable(id);
  }
}
