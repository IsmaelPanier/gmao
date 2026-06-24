import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../shared/errors/AppError";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(
        `This action requires one of these roles: ${roles.join(", ")}`
      ));
    }
    next();
  };
}

export function requireOwnerOrRole(
  getResourceUserId: (req: Request) => string | undefined,
  ...roles: Role[]
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    const resourceUserId = getResourceUserId(req);
    const isOwner = resourceUserId === req.user.sub;
    const hasRole = roles.includes(req.user.role);

    if (!isOwner && !hasRole) {
      return next(AppError.forbidden("Access denied"));
    }
    next();
  };
}
