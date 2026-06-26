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
  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await InterventionsService.accept(req.params.id as string, req.user!), "Mission acceptée"));
    } catch (err) { next(err); }
  },
  async refuse(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await InterventionsService.refuse(req.params.id as string, req.user!), "Mission refusée"));
    } catch (err) { next(err); }
  },
  async timeLog(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await InterventionsService.timeLog(req.params.id as string, req.body, req.user!), "Pointage enregistré"));
    } catch (err) { next(err); }
  },
  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: { message: "No files uploaded" } });
      }
      res.status(201).json(success(await InterventionsService.uploadMedia(req.params.id as string, files, req.user!), "Médias ajoutés avec succès"));
    } catch (err) { next(err); }
  },
};
