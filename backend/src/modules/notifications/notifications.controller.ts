import { Request, Response, NextFunction } from "express";
import { NotificationsService } from "./notifications.service";
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
};
