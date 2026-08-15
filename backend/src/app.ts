import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./common/middlewares/errorHandler.js";
import { container } from "./common/di/container.js";

// Routes
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createPlansRouter } from "./modules/plans/plans.routes.js";
import { createOrganizationsRouter } from "./modules/organizations/organizations.routes.js";
import { createPaymentsRouter } from "./modules/payments/payments.routes.js";
import { createWebhooksRouter } from "./modules/webhooks/webhooks.routes.js";
import { createSubscriptionsRouter } from "./modules/subscriptions/subscriptions.routes.js";
import { createUsersRouter } from "./modules/users/users.routes.js";
import { createTransactionsRouter } from "./modules/transactions/transactions.routes.js";
import { createPlatformRouter } from "./modules/platform/platform.routes.js";

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  // Webhook route MUST be mounted before express.json() — needs raw body for Stripe sig verification
  app.use("/api/v1/webhooks", createWebhooksRouter(container.webhooksController));

  app.use(express.json());
  app.use(cookieParser());

  // API routes
  const api = "/api/v1";
  app.use(`${api}/auth`, createAuthRouter(container.authController));
  app.use(`${api}/plans`, createPlansRouter(container.plansController));
  app.use(`${api}/checkout`, createPaymentsRouter(container.paymentsController));
  app.use(`${api}/org/billing`, createPaymentsRouter(container.paymentsController));
  app.use(`${api}/org`, createOrganizationsRouter(container.orgsController));
  app.use(`${api}/org`, createSubscriptionsRouter(container.subsController));
  app.use(`${api}/org`, createTransactionsRouter(container.txController));
  app.use(`${api}/me`, createUsersRouter(container.usersController));
  app.use(`${api}/platform`, createPlatformRouter(container.platformController, container.txController));

  app.use(errorHandler);

  return app;
}
