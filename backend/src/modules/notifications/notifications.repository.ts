import { PrismaClient } from "../../generated/prisma/client.js";
import type { NotificationType } from "./notifications.types.js";

export class NotificationsRepository {
  constructor(private readonly db: PrismaClient) {}

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
