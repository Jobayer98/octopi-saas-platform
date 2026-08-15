import { prisma } from "../lib/prisma.js";
import { env } from "../../config/env.js";

// Auth
import { AuthRepository } from "../../modules/auth/auth.repository.js";
import { AuthService } from "../../modules/auth/auth.service.js";
import { AuthController } from "../../modules/auth/auth.controller.js";

// Notifications
import { NodemailerProvider } from "../../modules/notifications/providers/nodemailer.provider.js";
import { NotificationsRepository } from "../../modules/notifications/notifications.repository.js";
import { NotificationsService } from "../../modules/notifications/notifications.service.js";

// Plans
import { PlansRepository } from "../../modules/plans/plans.repository.js";
import { PlansService } from "../../modules/plans/plans.service.js";
import { PlansController } from "../../modules/plans/plans.controller.js";

// Organizations
import { OrganizationsRepository } from "../../modules/organizations/organizations.repository.js";
import { OrganizationsService } from "../../modules/organizations/organizations.service.js";
import { OrganizationsController } from "../../modules/organizations/organizations.controller.js";

// Payments
import { StripeProvider } from "../../modules/payments/providers/stripe.provider.js";
import { PaymentsRepository } from "../../modules/payments/payments.repository.js";
import { PaymentsService } from "../../modules/payments/payments.service.js";
import { PaymentsController } from "../../modules/payments/payments.controller.js";

// Webhooks
import { WebhooksRepository } from "../../modules/webhooks/webhooks.repository.js";
import { WebhooksService } from "../../modules/webhooks/webhooks.service.js";
import { WebhooksController } from "../../modules/webhooks/webhooks.controller.js";

// Subscriptions
import { SubscriptionsRepository } from "../../modules/subscriptions/subscriptions.repository.js";
import { SubscriptionsService } from "../../modules/subscriptions/subscriptions.service.js";
import { SubscriptionsController } from "../../modules/subscriptions/subscriptions.controller.js";

// Users
import { UsersRepository } from "../../modules/users/users.repository.js";
import { UsersService } from "../../modules/users/users.service.js";
import { UsersController } from "../../modules/users/users.controller.js";

// Platform
import { PlatformRepository } from "../../modules/platform/platform.repository.js";
import { PlatformService } from "../../modules/platform/platform.service.js";
import { PlatformController } from "../../modules/platform/platform.controller.js";

// Transactions
import { TransactionsRepository } from "../../modules/transactions/transactions.repository.js";
import { TransactionsService } from "../../modules/transactions/transactions.service.js";
import { TransactionsController } from "../../modules/transactions/transactions.controller.js";

function buildContainer() {
  // Shared infra
  const notificationsRepo = new NotificationsRepository(prisma);
  const emailProvider = new NodemailerProvider({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  });
  const notifications = new NotificationsService(emailProvider, notificationsRepo);

  const stripeProvider = new StripeProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);

  // Auth
  const authRepo = new AuthRepository(prisma);
  const authService = new AuthService(authRepo, notifications);
  const authController = new AuthController(authService);

  // Plans
  const plansRepo = new PlansRepository(prisma);
  const plansService = new PlansService(plansRepo);
  const plansController = new PlansController(plansService);

  // Organizations
  const orgsRepo = new OrganizationsRepository(prisma);
  const orgsService = new OrganizationsService(orgsRepo, notifications);
  const orgsController = new OrganizationsController(orgsService);

  // Subscriptions
  const subsRepo = new SubscriptionsRepository(prisma);
  const subsService = new SubscriptionsService(subsRepo, plansRepo, stripeProvider, notifications);
  const subsController = new SubscriptionsController(subsService);

  // Payments
  const paymentsRepo = new PaymentsRepository(prisma);
  const paymentsService = new PaymentsService(paymentsRepo, subsRepo, stripeProvider);
  const paymentsController = new PaymentsController(paymentsService);

  // Webhooks
  const webhooksRepo = new WebhooksRepository(prisma);
  const webhooksService = new WebhooksService(webhooksRepo, stripeProvider, notifications);
  const webhooksController = new WebhooksController(webhooksService);

  // Users
  const usersRepo = new UsersRepository(prisma);
  const usersService = new UsersService(usersRepo, orgsRepo);
  const usersController = new UsersController(usersService);

  // Transactions
  const txRepo = new TransactionsRepository(prisma);
  const txService = new TransactionsService(txRepo);
  const txController = new TransactionsController(txService);

  // Platform
  const platformRepo = new PlatformRepository(prisma);
  const platformService = new PlatformService(platformRepo);
  const platformController = new PlatformController(platformService);

  return {
    authController,
    plansController,
    orgsController,
    paymentsController,
    webhooksController,
    subsController,
    usersController,
    txController,
    platformController,
  };
}

export const container = buildContainer();
