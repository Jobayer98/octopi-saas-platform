import { Router } from "express";
import { PlansController } from "./plans.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { Role } from "../../generated/prisma/enums.js";

export function createPlansRouter(controller: PlansController): Router {
  const router = Router();
  const adminOnly = [authenticate, authorizeRole(Role.PLATFORM_ADMIN)];

  router.get("/", controller.list.bind(controller));
  router.post("/", ...adminOnly, controller.create.bind(controller));
  router.patch("/:id", ...adminOnly, controller.update.bind(controller));
  router.patch("/:id/disable", ...adminOnly, controller.disable.bind(controller));

  return router;
}
