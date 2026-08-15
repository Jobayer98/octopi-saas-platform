import { Router } from "express";
import { PlatformController } from "./platform.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { Role } from "../../generated/prisma/enums.js";
import { TransactionsController } from "../transactions/transactions.controller.js";

const adminOnly = [authenticate, authorizeRole(Role.PLATFORM_ADMIN)];

export function createPlatformRouter(
  controller: PlatformController,
  txController?: TransactionsController,
): Router {
  const router = Router();

  router.get("/stats", ...adminOnly, controller.getStats);
  router.get("/organizations", ...adminOnly, controller.listOrgs);
  router.get("/organizations/:id", ...adminOnly, controller.getOrg);
  router.patch("/organizations/:id/suspend", ...adminOnly, controller.suspendOrg);
  router.patch("/organizations/:id/reactivate", ...adminOnly, controller.reactivateOrg);

  if (txController) {
    router.get("/transactions", ...adminOnly, txController.getAllTransactions);
  }

  return router;
}
