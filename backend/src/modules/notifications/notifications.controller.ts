import { Request, Response, NextFunction } from "express";
import { NotificationsService } from "./notifications.service";
import { ScheduledNotificationsService } from "./scheduled-notifications.service";
import { success } from "../../shared/types";

export const NotificationsController = {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false });
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await NotificationsService.getUserNotifications(req.user.sub, limit);
      res.json(success(notifications));
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false });
      await NotificationsService.markAsRead(req.params.id as string, req.user.sub);
      res.json(success(null, "Notification marked as read"));
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false });
      await NotificationsService.markAllAsRead(req.user.sub);
      res.json(success(null, "All notifications marked as read"));
    } catch (err) {
      next(err);
    }
  },

  async scheduleNotification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false });

      const { userId, title, message, link, type, delayMinutes } = req.body;
      if (!userId || !title || !message || !delayMinutes) {
        return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "userId, title, message et delayMinutes sont requis" } });
      }

      const delayMs = Math.min(delayMinutes, 60) * 60 * 1000; // Max 60 min
      const jobId = ScheduledNotificationsService.schedule(delayMs, { userId, title, message, link, type });

      res.json(success({ jobId, scheduledAt: new Date(Date.now() + delayMs) }, "Notification programmée"));
    } catch (err) {
      next(err);
    }
  },

  async cancelScheduledNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const cancelled = ScheduledNotificationsService.cancel(req.params.jobId);
      if (!cancelled) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Job introuvable ou déjà exécuté" } });
      res.json(success(null, "Notification annulée"));
    } catch (err) {
      next(err);
    }
  },
};
