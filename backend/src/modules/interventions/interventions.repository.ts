import prisma from "../../config/database";
import { InterventionStatus, InterventionPriority, Prisma } from "@prisma/client";
import { CreateInterventionDto, ListInterventionsQuery, UpdateInterventionDto } from "./interventions.dto";

const INCLUDE_FULL = {
  client: { select: { id: true, type: true, firstName: true, lastName: true, address: true, city: true, phone: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  technicians: {
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true } },
    },
  },
};

export const InterventionsRepository = {
  async findAll(query: ListInterventionsQuery, technicianId?: string) {
    const { page, limit, q, status, priority, clientId, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InterventionWhereInput = {
      ...(q && {
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { type: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(status && { status: status as InterventionStatus }),
      ...(priority && { priority: priority as InterventionPriority }),
      ...(clientId && { clientId }),
      ...(query.technicianId && {
        technicians: { some: { userId: query.technicianId } },
      }),
      ...(technicianId && {
        technicians: { some: { userId: technicianId } },
      }),
      ...(dateFrom || dateTo
        ? {
            scheduledDate: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + "T23:59:59") }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.intervention.findMany({
        where,
        include: INCLUDE_FULL,
        skip,
        take: limit,
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
      }),
      prisma.intervention.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.intervention.findUnique({ where: { id }, include: INCLUDE_FULL });
  },

  async create(dto: CreateInterventionDto, createdById: string, number: string) {
    const { technicianIds, ...rest } = dto;
    return prisma.intervention.create({
      data: {
        ...rest,
        number,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        createdById,
        status: technicianIds && technicianIds.length > 0 ? InterventionStatus.assigned : InterventionStatus.created,
        technicians: technicianIds?.length
          ? {
              create: technicianIds.map((uid) => ({ userId: uid })),
            }
          : undefined,
      },
      include: INCLUDE_FULL,
    });
  },

  async update(id: string, dto: UpdateInterventionDto) {
    const { technicianIds, ...rest } = dto;
    return prisma.$transaction(async (tx) => {
      if (technicianIds !== undefined) {
        await tx.interventionAssignment.deleteMany({ where: { interventionId: id } });
        if (technicianIds.length > 0) {
          await tx.interventionAssignment.createMany({
            data: technicianIds.map((uid) => ({ interventionId: id, userId: uid })),
          });
        }
      }
      return tx.intervention.update({
        where: { id },
        data: {
          ...rest,
          scheduledDate: rest.scheduledDate ? new Date(rest.scheduledDate) : rest.scheduledDate === null ? null : undefined,
          completedAt: rest.status === "completed" ? new Date() : rest.status === "in_progress" ? undefined : undefined,
          startedAt: rest.status === "in_progress" ? new Date() : undefined,
          status: rest.status as InterventionStatus | undefined,
          priority: rest.priority as InterventionPriority | undefined,
        },
        include: INCLUDE_FULL,
      });
    });
  },

  async delete(id: string) {
    return prisma.intervention.delete({ where: { id } });
  },

  async getLastNumber(): Promise<string> {
    const last = await prisma.intervention.findFirst({
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const year = new Date().getFullYear();
    if (!last) return `INT-${year}-001`;
    const parts = last.number.split("-");
    const seq = parseInt(parts[2] || "0") + 1;
    return `INT-${year}-${seq.toString().padStart(3, "0")}`;
  },
};
