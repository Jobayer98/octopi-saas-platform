import type { PrismaExtended } from "../../common/lib/prisma.js";
import type { NotificationType } from "./notifications.types.js";

export class NotificationsRepository {
  constructor(private readonly db: PrismaExtended) {}

  async log(data: {
    organizationId?: string;
    userId?: string;
    type: NotificationType;
    status: "SENT" | "FAILED";
  }): Promise<void> {
    await this.db.notificationLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        type: data.type,
        channel: "email",
        status: data.status,
      },
    });
  }
}
