import { z } from "zod";
import { emailSchema, passwordSchema } from "../../common/validation/base.schemas.js";

export const registerSchema = z.object({
  orgName: z.string().min(2),
  billingEmail: emailSchema,
  name: z.string().min(2),
  email: emailSchema,
  password: passwordSchema,
  planId: z.string().min(1),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
