export interface CreateCheckoutSessionInput {
  organizationId: string;
  planId: string;
  planName: string;
  priceCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface PaymentProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>;
  verifyWebhookSignature(payload: Buffer, signature: string): unknown;
}
