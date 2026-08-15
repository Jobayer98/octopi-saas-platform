import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();

  router.get("/profile", authenticate, controller.getProfile);
  router.patch("/profile", authenticate, controller.updateProfile);
  router.patch("/password", authenticate, controller.changePassword);

  return router;
}
