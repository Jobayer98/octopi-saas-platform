import type { NotificationProvider } from "./providers/notification-provider.interface.js";
import { NotificationsRepository } from "./notifications.repository.js";
import { env } from "../../config/env.js";

export class NotificationsService {
  constructor(
    private readonly provider: NotificationProvider,
    private readonly repo: NotificationsRepository,
  ) {}

  async sendPasswordReset(email: string, name: string, rawToken: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await this.send(
      email,
      "Reset your password",
      `<p>Hi ${name},</p><p><a href="${url}">Click here to reset your password</a>. This link expires in 1 hour.</p>`,
      { type: "PASSWORD_RESET" },
    );
  }

  async sendMemberInvite(
    email: string,
    orgName: string,
    rawToken: string,
    organizationId: string,
  ): Promise<void> {
    const url = `${env.FRONTEND_URL}/accept-invite?token=${encodeURIComponent(rawToken)}`;
    await this.send(
      email,
      `You've been invited to join ${orgName}`,
      `<p>You've been invited to join <strong>${orgName}</strong>.</p><p><a href="${url}">Accept invitation</a></p>`,
      { type: "MEMBER_INVITED", organizationId },
    );
  }

  async sendPaymentSuccess(
    email: string,
    orgName: string,
    amountCents: number,
    organizationId: string,
  ): Promise<void> {
    await this.send(
      email,
      "Payment successful",
      `<p>Payment of $${(amountCents / 100).toFixed(2)} for <strong>${orgName}</strong> was successful.</p>`,
      { type: "PAYMENT_SUCCESS", organizationId },
    );
  }

  async sendPaymentFailed(
    email: string,
    orgName: string,
    organizationId: string,
  ): Promise<void> {
    await this.send(
      email,
      "Payment failed",
      `<p>A payment for <strong>${orgName}</strong> failed. Please update your billing details.</p>`,
      { type: "PAYMENT_FAILED", organizationId },
    );
  }

  async sendSubscriptionEvent(
    email: string,
    orgName: string,
    event: "SUB_UPGRADED" | "SUB_DOWNGRADED" | "SUB_CANCELLED",
    organizationId: string,
  ): Promise<void> {
    const labels = {
      SUB_UPGRADED: "upgraded",
      SUB_DOWNGRADED: "downgraded",
      SUB_CANCELLED: "cancelled",
    };
    await this.send(
      email,
      `Subscription ${labels[event]}`,
      `<p>Your subscription for <strong>${orgName}</strong> has been ${labels[event]}.</p>`,
      { type: event, organizationId },
    );
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    log: { type: Parameters<NotificationsRepository["log"]>[0]["type"]; organizationId?: string },
  ): Promise<void> {
    try {
      await this.provider.sendEmail({ to, subject, html });
      await this.repo.log({ ...log, status: "SENT" }).catch(() => {/* log failure is non-fatal */});
    } catch (err) {
      // Notification failure must never crash the caller
      console.error(`[notifications] failed to send ${log.type} to ${to}:`, err);
      await this.repo.log({ ...log, status: "FAILED" }).catch(() => {/* ignore */});
    }
  }
}
