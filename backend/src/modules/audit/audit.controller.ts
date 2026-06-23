import { Request, Response, NextFunction } from "express";
import { AuditService } from "./audit.service";
import { success } from "../../shared/types";

export const AuditController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filters = {
        userId: req.query.userId as string,
        entity: req.query.entity as string,
        action: req.query.action as string,
      };

      const result = await AuditService.getLogs(page, limit, filters);
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },
};
