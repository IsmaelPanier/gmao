import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";
import { JwtPayload } from "../../shared/types";
import { LoginDto, RegisterDto } from "./auth.dto";
import { Role } from "@prisma/client";

const SALT_ROUNDS = 10;

function generateTokens(payload: Omit<JwtPayload, "iat" | "exp">) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export const AuthService = {
  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized("Invalid credentials");
    }

    if (!user.emailVerified) {
      throw AppError.unauthorized("Votre compte n'est pas encore activé. Vérifiez votre email.");
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const { accessToken, refreshToken } = generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw AppError.conflict("Un compte existe déjà avec cet email");
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name,
        role: "admin" as Role,
        phone: dto.phone,
        emailVerified: true,
        isActive: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    if (!tokenRecord.user.isActive) {
      throw AppError.unauthorized("User account is disabled");
    }

    // Rotate token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken?: string, accessToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }
    if (accessToken) {
      await prisma.tokenBlacklist.create({
        data: { token: accessToken }
      }).catch(() => {}); // Ignore if already blacklisted
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");
    return sanitizeUser(user);
  },

  async validateActivationToken(token: string) {
    const record = await prisma.activationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw AppError.badRequest("Ce lien d'activation est invalide ou expiré");
    }

    return { email: record.user.email, name: record.user.name };
  },

  async activateAccount(token: string, password: string) {
    const record = await prisma.activationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw AppError.badRequest("Ce lien d'activation est invalide ou expiré");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword, isActive: true, emailVerified: true },
      }),
      prisma.activationToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return { message: "Compte activé avec succès" };
  },
};
