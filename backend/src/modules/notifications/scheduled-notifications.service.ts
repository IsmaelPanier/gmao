import { NotificationsService } from "./notifications.service";
import { NotificationType } from "@prisma/client";

interface ScheduledJob {
  id: string;
  timeoutHandle: NodeJS.Timeout;
  scheduledAt: Date;
  data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  };
}

const jobs = new Map<string, ScheduledJob>();
let jobCounter = 0;

export const ScheduledNotificationsService = {
  schedule(
    delayMs: number,
    data: { userId: string; type?: NotificationType; title: string; message: string; link?: string }
  ): string {
    const jobId = `job_${++jobCounter}_${Date.now()}`;
    const scheduledAt = new Date(Date.now() + delayMs);

    const timeoutHandle = setTimeout(async () => {
      jobs.delete(jobId);
      await NotificationsService.sendNotification({
        ...data,
        type: data.type || "INFO",
      });
    }, delayMs);

    jobs.set(jobId, {
      id: jobId,
      timeoutHandle,
      scheduledAt,
      data: { ...data, type: data.type || "INFO" },
    });

    return jobId;
  },

  cancel(jobId: string): boolean {
    const job = jobs.get(jobId);
    if (!job) return false;
    clearTimeout(job.timeoutHandle);
    jobs.delete(jobId);
    return true;
  },

  listPending(): Array<{ id: string; scheduledAt: Date; title: string; userId: string }> {
    return Array.from(jobs.values()).map((j) => ({
      id: j.id,
      scheduledAt: j.scheduledAt,
      title: j.data.title,
      userId: j.data.userId,
    }));
  },
};
