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

  router.get("/stats", ...adminOnly, controller.getStats.bind(controller));
  router.get("/organizations", ...adminOnly, controller.listOrgs.bind(controller));
  router.get("/organizations/:id", ...adminOnly, controller.getOrg.bind(controller));
  router.patch("/organizations/:id/suspend", ...adminOnly, controller.suspendOrg.bind(controller));
  router.patch("/organizations/:id/reactivate", ...adminOnly, controller.reactivateOrg.bind(controller));

  if (txController) {
    router.get("/transactions", ...adminOnly, txController.getAllTransactions.bind(txController));
  }

  return router;
}
