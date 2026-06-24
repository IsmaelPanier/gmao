import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { success } from "../../shared/types";

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(success(result, "Login successful"));
    } catch (err) {
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(success(result, "User registered successfully"));
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      res.status(200).json(success(result, "Token refreshed"));
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;
      await AuthService.logout(req.body.refreshToken, accessToken);
      res.status(200).json(success(null, "Logged out successfully"));
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.me(req.user!.sub);
      res.status(200).json(success(user));
    } catch (err) {
      next(err);
    }
  },
};
