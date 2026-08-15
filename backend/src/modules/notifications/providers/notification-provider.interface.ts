export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface NotificationProvider {
  sendEmail(input: SendEmailInput): Promise<void>;
}
