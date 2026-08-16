import { Request, Response, NextFunction } from "express";
import { WebhooksService } from "./webhooks.service.js";

export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  async handleStripe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
      }
      await this.service.handleStripeWebhook(req.body as Buffer, signature);
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[webhook error]", err);
      // Always return 200 to Stripe to prevent retries on signature mismatch
      // (happens when Dashboard webhook fires alongside stripe listen CLI)
      if ((err as { code?: string })?.code === "BAD_REQUEST") {
        res.status(200).json({ received: true, skipped: true });
        return;
      }
      next(err);
    }
  }
}
