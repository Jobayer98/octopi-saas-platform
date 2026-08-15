import { Router } from "express";
import { TransactionsController } from "./transactions.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeTenant } from "../../common/middlewares/authorizeTenant.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { Role } from "../../generated/prisma/enums.js";

export function createTransactionsRouter(controller: TransactionsController): Router {
  const router = Router();

  router.get(
    "/transactions",
    authenticate,
    authorizeTenant,
    authorizeRole(Role.ORG_ADMIN),
    controller.getOrgTransactions,
  );

  return router;
}
