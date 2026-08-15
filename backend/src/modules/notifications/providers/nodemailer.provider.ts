import nodemailer from "nodemailer";
import type { NotificationProvider, SendEmailInput } from "./notification-provider.interface.js";

export class NodemailerProvider implements NotificationProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
    this.from = config.from;
  }

  private readonly from: string;

  async sendEmail(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}
