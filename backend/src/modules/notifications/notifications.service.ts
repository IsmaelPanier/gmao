import prisma from "../../config/database";
import { getIO } from "./socket";
import { NotificationType } from "@prisma/client";

export const NotificationsService = {
  async sendNotification(data: {
    userId: string;
    type?: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    // 1. Save to DB
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type || "INFO",
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    // 2. Emit via WebSockets
    try {
      const io = getIO();
      io.to(`user:${data.userId}`).emit("notification", notification);
    } catch (err) {
      // Socket not initialized or user offline, silent ignore
    }

    return notification;
  },

  async getUserNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
