import { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeTenant } from "../../common/middlewares/authorizeTenant.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { Role } from "../../generated/prisma/enums.js";

export function createSubscriptionsRouter(controller: SubscriptionsController): Router {
  const router = Router();
  const orgMember = [authenticate, authorizeTenant];
  const orgAdmin = [authenticate, authorizeTenant, authorizeRole(Role.ORG_ADMIN)];

  router.get("/subscription", ...orgMember, controller.getSubscription.bind(controller));
  router.post("/subscription/upgrade", ...orgAdmin, controller.upgrade.bind(controller));
  router.post("/subscription/downgrade", ...orgAdmin, controller.upgrade.bind(controller)); // same flow — new checkout session
  router.post("/subscription/cancel", ...orgAdmin, controller.cancel.bind(controller));

  return router;
}
