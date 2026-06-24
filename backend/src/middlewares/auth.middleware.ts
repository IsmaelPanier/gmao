import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../shared/errors/AppError";
import { JwtPayload } from "../shared/types";

import prisma from "../config/database";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("No token provided"));
  }

  const token = authHeader.slice(7);
  try {
    const isBlacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (isBlacklisted) return next(AppError.unauthorized("Token has been revoked"));

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired token"));
  }
}
