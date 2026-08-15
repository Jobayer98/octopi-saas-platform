import { z } from "zod";
import { emailSchema, passwordSchema } from "../../common/validation/base.schemas.js";

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: emailSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
