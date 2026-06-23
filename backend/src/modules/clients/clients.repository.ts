import prisma from "../../config/database";
import { CreateClientDto, ListClientsQuery, UpdateClientDto } from "./clients.dto";

export const ClientsRepository = {
  async findAll(query: ListClientsQuery) {
    const { page, limit, q, type } = query;
    const skip = (page - 1) * limit;
    const where = {
      ...(type ? { type } : {}),
      ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take: limit, orderBy: { lastName: "asc" } }),
      prisma.client.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        interventions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async create(dto: CreateClientDto) {
    return prisma.client.create({ data: dto });
  },

  async update(id: string, dto: UpdateClientDto) {
    return prisma.client.update({ where: { id }, data: dto });
  },

  async delete(id: string) {
    return prisma.client.delete({ where: { id } });
  },
};
