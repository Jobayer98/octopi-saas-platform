import { Router } from "express";
import express from "express";
import { WebhooksController } from "./webhooks.controller.js";

export function createWebhooksRouter(controller: WebhooksController): Router {
  const router = Router();

  // Raw body required for Stripe signature verification — mounted before express.json() in app.ts
  router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    controller.handleStripe.bind(controller),
  );

  return router;
}
