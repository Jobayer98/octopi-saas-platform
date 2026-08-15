import Stripe from "stripe";
import type {
  PaymentProvider,
  CreateCheckoutSessionInput,
  CheckoutSession,
} from "./payment-provider.interface.js";

export class StripeProvider implements PaymentProvider {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: input.currency,
            unit_amount: input.priceCents,
            product_data: { name: input.planName },
          },
          quantity: 1,
        },
      ],
      metadata: { organizationId: input.organizationId, planId: input.planId },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return { id: session.id, url: session.url! };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
