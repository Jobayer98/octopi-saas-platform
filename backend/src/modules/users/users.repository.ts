import type { PrismaExtended } from "../../common/lib/prisma.js";

export class UsersRepository {
  constructor(private readonly db: PrismaExtended) {}

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { organization: { select: { id: true, name: true, status: true } } },
    });
  }

  async updateProfile(id: string, data: { name?: string; email?: string }) {
    return this.db.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.db.user.update({ where: { id }, data: { passwordHash } });
  }
}
