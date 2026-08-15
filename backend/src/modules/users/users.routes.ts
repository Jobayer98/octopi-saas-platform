import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();

  router.get("/profile", authenticate, controller.getProfile.bind(controller));
  router.patch("/profile", authenticate, controller.updateProfile.bind(controller));
  router.patch("/password", authenticate, controller.changePassword.bind(controller));

  return router;
}
