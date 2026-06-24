import prisma from "../../config/database";
import { Role } from "@prisma/client";
import { ListUsersQuery, UpdateUserDto } from "./users.dto";

const SELECT_USER = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const UsersRepository = {
  async findAll(query: ListUsersQuery) {
    const { page, limit, role, q } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role: role as Role }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: SELECT_USER,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: SELECT_USER });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, select: SELECT_USER });
  },

  async create(data: any) {
    return prisma.user.create({ data, select: SELECT_USER });
  },

  async update(id: string, dto: UpdateUserDto) {
    // Convertir phone vide en null pour effacer la valeur
    const data: any = { ...dto };
    if (data.phone === "") data.phone = null;
    return prisma.user.update({ where: { id }, data, select: SELECT_USER });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
