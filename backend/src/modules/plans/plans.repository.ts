import type { PrismaExtended } from "../../common/lib/prisma.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plans.types.js";

export class PlansRepository {
  constructor(private readonly db: PrismaExtended) {}

  async findAll(activeOnly = false) {
    return this.db.plan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { priceCents: "asc" },
    });
  }

  async findById(id: string) {
    return this.db.plan.findUnique({ where: { id } });
  }

  async create(input: CreatePlanInput) {
    return this.db.plan.create({ data: { ...input, features: input.features } });
  }

  async update(id: string, input: UpdatePlanInput) {
    return this.db.plan.update({
      where: { id },
      data: { ...input, ...(input.features ? { features: input.features } : {}) },
    });
  }

  async disable(id: string) {
    return this.db.plan.update({ where: { id }, data: { isActive: false } });
  }
}
