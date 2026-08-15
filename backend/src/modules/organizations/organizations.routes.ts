import { Router } from "express";
import { OrganizationsController } from "./organizations.controller.js";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorizeRole } from "../../common/middlewares/authorizeRole.js";
import { authorizeTenant } from "../../common/middlewares/authorizeTenant.js";
import { Role } from "../../generated/prisma/enums.js";

export function createOrganizationsRouter(controller: OrganizationsController): Router {
  const router = Router();
  const orgAdmin = [authenticate, authorizeTenant, authorizeRole(Role.ORG_ADMIN)];
  const orgMember = [authenticate, authorizeTenant];

  router.get("/profile", ...orgMember, controller.getProfile.bind(controller));
  router.patch("/profile", ...orgAdmin, controller.updateProfile.bind(controller));
  router.get("/members", ...orgMember, controller.listMembers.bind(controller));
  router.post("/members/invite", ...orgAdmin, controller.inviteMember.bind(controller));
  router.post("/members/accept-invite", controller.acceptInvite.bind(controller)); // public but token-gated
  router.patch("/members/:userId/role", ...orgAdmin, controller.updateMemberRole.bind(controller));
  router.delete("/members/:userId", ...orgAdmin, controller.removeMember.bind(controller));

  return router;
}
