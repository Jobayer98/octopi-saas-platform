import { Router } from "express";
import { PaymentsController } from "./payments.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeTenant } from "../../common/middlewares/authorizeTenant.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { Role } from "../../generated/prisma/enums.js";

export function createPaymentsRouter(controller: PaymentsController): Router {
  const router = Router();
  const orgAdmin = [authenticate, authorizeTenant, authorizeRole(Role.ORG_ADMIN)];

  router.post("/session", authenticate, authorizeTenant, controller.createSession.bind(controller));
  router.get("/status", authenticate, authorizeTenant, controller.getStatus.bind(controller));
  // Billing history also accessible via /org/billing/payments — mounted under /checkout here
  router.get("/payments", ...orgAdmin, controller.getPaymentHistory.bind(controller));

  return router;
}
