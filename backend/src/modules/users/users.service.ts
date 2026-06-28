import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../config/database";
import { AppError } from "../../shared/errors/AppError";
import { UsersRepository } from "./users.repository";
import { ListUsersQuery, UpdateUserDto, CreateUserDto } from "./users.dto";
import { sendMail, buildActivationEmail } from "../../config/email";
import { env } from "../../config/env";

const ACTIVATION_EXPIRES_HOURS = 24;

async function createActivationToken(userId: string): Promise<string> {
  // Invalide les anciens tokens
  await prisma.activationToken.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ACTIVATION_EXPIRES_HOURS);

  await prisma.activationToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export const UsersService = {
  async findAll(query: ListUsersQuery) {
    return UsersRepository.findAll(query);
  },

  async findById(id: string) {
    const user = await UsersRepository.findById(id);
    if (!user) throw AppError.notFound(`User '${id}' not found`);
    return user;
  },

  async create(dto: CreateUserDto) {
    const existing = await UsersRepository.findByEmail(dto.email.toLowerCase());
    if (existing) throw AppError.conflict("Cet email est déjà utilisé");

    // Mot de passe temporaire — sera remplacé lors de l'activation
    const tempPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

    const user = await UsersRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: tempPassword,
      isActive: false,
      emailVerified: false,
    });

    const token = await createActivationToken(user.id);
    const activationUrl = `${env.FRONTEND_URL}/activate/${token}`;

    await sendMail({
      to: user.email,
      subject: "Activez votre compte GMAO Pro",
      html: buildActivationEmail(user.name, activationUrl),
    });

    return { ...user, activationUrl: env.NODE_ENV !== "production" ? activationUrl : undefined };
  },

  async resendInvitation(id: string) {
    const user = await UsersRepository.findById(id);
    if (!user) throw AppError.notFound(`User '${id}' not found`);
    if (user.emailVerified) throw AppError.unprocessable("Ce compte est déjà activé");

    const token = await createActivationToken(id);
    const activationUrl = `${env.FRONTEND_URL}/activate/${token}`;

    await sendMail({
      to: user.email,
      subject: "Activez votre compte GMAO Pro",
      html: buildActivationEmail(user.name, activationUrl),
    });

    return { message: "Invitation renvoyée", activationUrl: env.NODE_ENV !== "production" ? activationUrl : undefined };
  },

  async update(id: string, dto: UpdateUserDto) {
    await UsersService.findById(id);
    return UsersRepository.update(id, dto);
  },

  async delete(id: string) {
    await UsersService.findById(id);
    return UsersRepository.delete(id);
  },
};
