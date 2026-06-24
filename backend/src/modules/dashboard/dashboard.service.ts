import prisma from "../../config/database";
import { InterventionStatus } from "@prisma/client";

export const DashboardService = {
  async getStats() {
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const todayEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));

    // Parallel queries for performance
    const [
      total,
      byStatus,
      todayCount,
      recentInterventions,
      byTechnician,
      byMonth,
      workload,
    ] = await Promise.all([
      prisma.intervention.count(),

      prisma.intervention.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      prisma.intervention.count({
        where: {
          scheduledDate: { gte: todayStart, lt: todayEnd },
        },
      }),

      prisma.intervention.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, type: true } },
          technicians: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),

      // Top technicians by completed interventions
      prisma.interventionAssignment.groupBy({
        by: ["userId"],
        _count: { userId: true },
        where: {
          intervention: { status: InterventionStatus.completed },
        },
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      }),

      // Interventions by month (last 6 months)
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "scheduledDate"), 'Mon YYYY') as month,
          COUNT(*) as count
        FROM interventions
        WHERE "scheduledDate" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "scheduledDate")
        ORDER BY DATE_TRUNC('month', "scheduledDate") ASC
      `,

      // Active assignments per technician (workload)
      prisma.interventionAssignment.groupBy({
        by: ["userId"],
        _count: { userId: true },
        where: {
          intervention: { status: { in: [InterventionStatus.assigned, InterventionStatus.in_progress, InterventionStatus.waiting] } },
        },
        orderBy: { _count: { userId: "desc" } },
      }),
    ]);

    // Resolve technician names for productivity and workload charts
    const techIds = Array.from(new Set([...byTechnician.map((t) => t.userId), ...workload.map((w) => w.userId)]));
    const technicianUsers = await prisma.user.findMany({
      where: { id: { in: techIds } },
      select: { id: true, name: true },
    });

    const resolveName = (id: string) => technicianUsers.find((u) => u.id === id)?.name ?? "Unknown";

    const byTechnicianNamed = byTechnician.map((t) => ({
      id: t.userId,
      name: resolveName(t.userId),
      count: t._count.userId,
    }));
    
    const teamWorkload = workload.map((w) => ({
      id: w.userId,
      name: resolveName(w.userId),
      count: w._count.userId,
    }));

    // Compute stats
    const statusMap: Record<string, number> = {};
    byStatus.forEach((s) => { statusMap[s.status] = s._count.status; });

    const completed = statusMap[InterventionStatus.completed] ?? 0;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average duration of completed interventions
    const avgDurationResult = await prisma.intervention.aggregate({
      where: { status: InterventionStatus.completed, durationActual: { not: null } },
      _avg: { durationActual: true },
    });
    const avgDuration = Math.round(avgDurationResult._avg.durationActual ?? 0);

    return {
      total,
      today: todayCount,
      in_progress: statusMap[InterventionStatus.in_progress] ?? 0,
      completed,
      pending:
        (statusMap[InterventionStatus.created] ?? 0) +
        (statusMap[InterventionStatus.assigned] ?? 0) +
        (statusMap[InterventionStatus.waiting] ?? 0),
      cancelled: statusMap[InterventionStatus.cancelled] ?? 0,
      by_status: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
      resolution_rate: resolutionRate,
      avg_duration: avgDuration,
      by_month: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
      by_technician: byTechnicianNamed,
      team_workload: teamWorkload,
      recent: recentInterventions,
    };
  },
};
