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

  router.get("/profile", ...orgMember, controller.getProfile);
  router.patch("/profile", ...orgAdmin, controller.updateProfile);
  router.get("/members", ...orgMember, controller.listMembers);
  router.post("/members/invite", ...orgAdmin, controller.inviteMember);
  router.post("/members/accept-invite", controller.acceptInvite); // public but token-gated
  router.patch("/members/:userId/role", ...orgAdmin, controller.updateMemberRole);
  router.delete("/members/:userId", ...orgAdmin, controller.removeMember);

  return router;
}
