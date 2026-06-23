import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service";
import { success } from "../../shared/types";

export const DashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await DashboardService.getStats()));
    } catch (err) { next(err); }
  },
};
