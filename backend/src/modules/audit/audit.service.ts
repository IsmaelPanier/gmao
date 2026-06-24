import prisma from "../../config/database";

export const AuditService = {
  async log(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ip?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          metadata: data.metadata || null,
          ip: data.ip,
        },
      });
    } catch (err) {
      // We don't want audit logging failure to crash the app, just log to console
      console.error("Failed to write audit log:", err);
    }
  },

  async getLogs(page = 1, limit = 50, filters?: { userId?: string; entity?: string; action?: string }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.entity && { entity: filters.entity }),
      ...(filters?.action && { action: filters.action }),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
