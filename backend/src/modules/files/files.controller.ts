import { Request, Response, NextFunction } from "express";
import { FilesService } from "./files.service";
import { success } from "../../shared/types";
import { AppError } from "../../shared/errors/AppError";
import { MediaType } from "@prisma/client";

export const FilesController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw AppError.badRequest("No file uploaded");
      if (!req.user) throw AppError.unauthorized();

      const { interventionId } = req.params;
      const { type } = req.body; // PHOTO, SIGNATURE, DOCUMENT

      if (!Object.values(MediaType).includes(type)) {
        throw AppError.badRequest("Invalid media type");
      }

      const media = await FilesService.uploadInterventionMedia(
        interventionId,
        req.user.sub,
        req.file,
        type as MediaType
      );

      res.status(201).json(success(media, "File uploaded successfully"));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      await FilesService.deleteMedia(req.params.id, req.user.sub);
      res.json(success(null, "Media deleted successfully"));
    } catch (err) {
      next(err);
    }
  },
};
