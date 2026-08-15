export type Role = "PLATFORM_ADMIN" | "ORG_ADMIN" | "ORG_MEMBER";
export type OrgStatus = "PENDING_PAYMENT" | "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED";
export type SubscriptionStatus = "ACTIVE" | "PENDING" | "FAILED" | "CANCELLED" | "EXPIRED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "ROLLED_BACK";
export type BillingInterval = "MONTHLY" | "YEARLY";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  organizationId?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  billingEmail: string;
  contactInfo?: Record<string, string>;
  status: OrgStatus;
  createdAt: string;
  _count?: { users: number };
}

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  billingInterval: BillingInterval;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  plan?: Plan;
}

export interface Payment {
  id: string;
  organizationId: string;
  subscriptionId?: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  organizationId: string;
  paymentId?: string;
  type: string;
  status: TransactionStatus;
  amountCents: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  organization?: { name: string };
}

export interface PlatformStats {
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenueCents: number;
  failedPayments: number;
}

export interface ApiError {
  error: { code: string; message: string };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
