import { Request, Response, NextFunction } from "express";
import { WebhooksService } from "./webhooks.service.js";

export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  handleStripe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      await this.service.handleStripeWebhook(req.body as Buffer, signature);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };
}
