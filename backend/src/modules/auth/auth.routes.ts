import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authRateLimiter } from "../../common/middlewares/rateLimiter.js";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/register", controller.register.bind(controller));
  router.post("/login", authRateLimiter, controller.login.bind(controller));
  router.post("/refresh", controller.refresh.bind(controller));
  router.post("/logout", authenticate, controller.logout.bind(controller));
  router.post(
    "/forgot-password",
    authRateLimiter,
    controller.forgotPassword.bind(controller),
  );
  router.post(
    "/reset-password",
    authRateLimiter,
    controller.resetPassword.bind(controller),
  );
  router.get("/me", authenticate, controller.me.bind(controller));

  return router;
}
