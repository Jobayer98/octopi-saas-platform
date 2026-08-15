import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authRateLimiter } from "../../common/middlewares/rateLimiter.js";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", authRateLimiter, controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/logout", authenticate, controller.logout);
  router.post("/forgot-password", authRateLimiter, controller.forgotPassword);
  router.post("/reset-password", authRateLimiter, controller.resetPassword);
  router.get("/me", authenticate, controller.me);

  return router;
}
