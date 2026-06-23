import { Request, Response, NextFunction } from "express";
import { ClientsService } from "./clients.service";
import { success } from "../../shared/types";

export const ClientsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await ClientsService.findAll(req.query as any)));
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await ClientsService.findById(req.params.id as string)));
    } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(success(await ClientsService.create(req.body), "Client created"));
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(success(await ClientsService.update(req.params.id as string, req.body), "Client updated"));
    } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await ClientsService.delete(req.params.id as string);
      res.json(success(null, "Client deleted"));
    } catch (err) { next(err); }
  },
};
