import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import { getTenantContext } from "../../context/tenant-context.js";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const result = await this.service.register(input);
      res.status(201).json({ orgId: result.orgId, userId: result.userId });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const { accessToken, refreshToken, refreshTokenId, user } =
        await this.service.login(input);

      res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
      res.json({ accessToken, refreshTokenId, user });
    } catch (err) {
      next(err);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      if (!token) {
        res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "No refresh token" },
        });
        return;
      }
      const tokens = await this.service.refresh(token);
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTS);
      res.json({
        accessToken: tokens.accessToken,
        refreshTokenId: tokens.refreshTokenId,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = getTenantContext();
      const tokenId = (req.body as { refreshTokenId?: string }).refreshTokenId;
      if (ctx && tokenId) await this.service.logout(tokenId);
      res.clearCookie(REFRESH_COOKIE);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      await this.service.forgotPassword(email);
      res.json({ message: "If that email exists, a reset link has been sent" });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      await this.service.resetPassword(token, password);
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      next(err);
    }
  }

  async me(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = getTenantContext();
      if (!ctx) {
        res
          .status(401)
          .json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
        return;
      }
      const user = await this.service.getMe(ctx.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}
