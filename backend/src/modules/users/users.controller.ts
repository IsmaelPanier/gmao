import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { success } from "../../shared/types";

export const UsersController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UsersService.findAll(req.query as any);
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.create(req.body);
      res.status(201).json(success(user, "User created"));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.findById(req.params.id as string);
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.update(req.params.id as string, req.body);
      res.json(success(user, "User updated"));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await UsersService.delete(req.params.id as string);
      res.json(success(null, "User deleted"));
    } catch (err) {
      next(err);
    }
  },
};
