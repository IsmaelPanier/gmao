import { Request, Response, NextFunction } from "express";
import { InterventionsService } from "./interventions.service";
import { success } from "../../shared/types";

export const InterventionsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await InterventionsService.findAll(req.query as any, req.user!)));
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await InterventionsService.findById(req.params.id as string, req.user!)));
    } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(success(await InterventionsService.create(req.body, req.user!), "Intervention created"));
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await InterventionsService.update(req.params.id as string, req.body, req.user!), "Intervention updated"));
    } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await InterventionsService.delete(req.params.id as string);
      res.json(success(null, "Intervention deleted"));
    } catch (err) { next(err); }
  },
};
