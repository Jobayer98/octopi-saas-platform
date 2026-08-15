import { Router } from "express";
import { PlansController } from "./plans.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { Role } from "../../generated/prisma/enums.js";

export function createPlansRouter(controller: PlansController): Router {
  const router = Router();
  const adminOnly = [authenticate, authorizeRole(Role.PLATFORM_ADMIN)];

  router.get("/", authenticate, controller.list);
  router.post("/", ...adminOnly, controller.create);
  router.patch("/:id", ...adminOnly, controller.update);
  router.patch("/:id/disable", ...adminOnly, controller.disable);

  return router;
}
