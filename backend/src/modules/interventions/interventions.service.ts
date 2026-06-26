import { AppError } from "../../shared/errors/AppError";
import { InterventionsRepository } from "./interventions.repository";
import { CreateInterventionDto, ListInterventionsQuery, UpdateInterventionDto } from "./interventions.dto";
import { JwtPayload } from "../../shared/types";
import { InterventionStatus } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { minioClient, BUCKET_NAME } from "../../config/minio";
import prisma from "../../config/database";
import crypto from "crypto";
import path from "path";

// Valid status transitions
const STATUS_TRANSITIONS: Record<InterventionStatus, InterventionStatus[]> = {
  created: ["assigned", "cancelled"],
  assigned: ["in_progress", "waiting", "cancelled"],
  in_progress: ["waiting", "completed", "cancelled"],
  waiting: ["in_progress", "assigned", "cancelled"],
  completed: [],
  cancelled: [],
};

export const InterventionsService = {
  async findAll(query: ListInterventionsQuery, currentUser: JwtPayload) {
    // Technicians can only see their own interventions
    const technicianId = currentUser.role === "technician" ? currentUser.sub : undefined;
    return InterventionsRepository.findAll(query, technicianId);
  },

  async findById(id: string, currentUser: JwtPayload) {
    const intervention = await InterventionsRepository.findById(id);
    if (!intervention) throw AppError.notFound(`Intervention '${id}' not found`);

    // Technicians can only see interventions assigned to them
    if (currentUser.role === "technician") {
      const isAssigned = intervention.technicians.some((t) => t.userId === currentUser.sub);
      if (!isAssigned) throw AppError.forbidden("Access denied");
    }

    return intervention;
  },

  async create(dto: CreateInterventionDto, currentUser: JwtPayload) {
    const number = await InterventionsRepository.getLastNumber();
    const intervention = await InterventionsRepository.create(dto, currentUser.sub, number);
    
    // Notifications si assignation immédiate
    if (dto.technicianIds && dto.technicianIds.length > 0) {
      for (const techId of dto.technicianIds) {
        NotificationsService.sendNotification({
          userId: techId,
          type: "INFO",
          title: "Nouvelle Mission",
          message: `Vous avez été assigné à l'intervention ${number}`,
          link: `/interventions/${intervention.id}`,
        });
      }
    }
    
    return intervention;
  },

  async update(id: string, dto: UpdateInterventionDto, currentUser: JwtPayload) {
    const intervention = await InterventionsService.findById(id, currentUser);

    // Validate status transition
    if (dto.status && dto.status !== intervention.status) {
      const allowed = STATUS_TRANSITIONS[intervention.status as InterventionStatus];
      if (!allowed.includes(dto.status as InterventionStatus)) {
        throw AppError.unprocessable(
          `Cannot transition from '${intervention.status}' to '${dto.status}'. Allowed: ${allowed.join(", ") || "none"}`
        );
      }

      // Technicians can only update status (not reassign, etc.)
      if (currentUser.role === "technician") {
        const allowedForTech = ["in_progress", "waiting", "completed"];
        if (!allowedForTech.includes(dto.status)) {
          throw AppError.forbidden("Technicians can only set status to in_progress, waiting or completed");
        }
        
        // Notification for manager
        NotificationsService.sendNotification({
          userId: intervention.createdById,
          type: dto.status === "completed" ? "SUCCESS" : "INFO",
          title: "Changement de statut",
          message: `L'intervention ${intervention.number} est passée à ${dto.status}`,
          link: `/interventions/${intervention.id}`,
        });

        // Strip non-status fields for technicians
        return InterventionsRepository.update(id, { status: dto.status as InterventionStatus });
      }
    }
    
    // Si on met à jour les techniciens ou le statut, vérifier la cohérence
    const nextStatus = dto.status || intervention.status;
    const nextTechs = dto.technicianIds !== undefined ? dto.technicianIds : intervention.technicians.map(t => t.userId);
    
    if (["assigned", "in_progress", "completed"].includes(nextStatus)) {
       if (nextTechs.length === 0) {
         throw AppError.unprocessable("Une intervention ne peut pas être assignée ou en cours sans techniciens.");
       }
    }
    
    if (nextStatus === "created" && nextTechs.length > 0) {
       dto.status = "assigned";
    }

    const updated = await InterventionsRepository.update(id, dto);

    // Notifications pour les nouveaux assignés (si modifiés)
    if (dto.technicianIds) {
      const oldTechs = intervention.technicians.map((t) => t.userId);
      const newTechs = dto.technicianIds.filter((tId) => !oldTechs.includes(tId));
      for (const techId of newTechs) {
        NotificationsService.sendNotification({
          userId: techId,
          type: "INFO",
          title: "Nouvelle Mission",
          message: `Vous avez été assigné à l'intervention ${intervention.number}`,
          link: `/interventions/${intervention.id}`,
        });
      }
    }

    return updated;
  },

  async delete(id: string) {
    const intervention = await InterventionsRepository.findById(id);
    if (!intervention) throw AppError.notFound(`Intervention '${id}' not found`);

    const activeStatuses: InterventionStatus[] = ["in_progress", "assigned"];
    if (activeStatuses.includes(intervention.status as InterventionStatus)) {
      throw AppError.unprocessable("Cannot delete an active intervention. Cancel it first.");
    }

    return InterventionsRepository.delete(id);
  },

  async accept(id: string, currentUser: JwtPayload) {
    const intervention = await InterventionsService.findById(id, currentUser);
    const assignment = intervention.technicians.find((t) => t.userId === currentUser.sub);
    if (!assignment) throw AppError.forbidden("Vous n'êtes pas assigné à cette intervention.");
    if (assignment.status !== "PENDING") throw AppError.unprocessable("Mission déjà acceptée ou refusée.");
    return InterventionsRepository.accept(id, currentUser.sub);
  },

  async refuse(id: string, currentUser: JwtPayload) {
    const intervention = await InterventionsService.findById(id, currentUser);
    const assignment = intervention.technicians.find((t) => t.userId === currentUser.sub);
    if (!assignment) throw AppError.forbidden("Vous n'êtes pas assigné à cette intervention.");
    if (assignment.status !== "PENDING") throw AppError.unprocessable("Mission déjà acceptée ou refusée.");
    return InterventionsRepository.refuse(id, currentUser.sub);
  },

  async timeLog(id: string, dto: { type: "START" | "PAUSE" | "RESUME" | "END" }, currentUser: JwtPayload) {
    const intervention = await InterventionsService.findById(id, currentUser);
    const assignment = intervention.technicians.find((t) => t.userId === currentUser.sub);
    if (!assignment) throw AppError.forbidden("Vous n'êtes pas assigné à cette intervention.");
    if (assignment.status !== "ACCEPTED") throw AppError.unprocessable("Vous devez accepter la mission avant de pointer.");

    const log = await InterventionsRepository.timeLog(id, currentUser.sub, dto.type);

    // Mettre à jour l'état de l'intervention en fonction du pointage
    if (dto.type === "START") {
      if (intervention.status !== "in_progress") {
        await InterventionsRepository.update(id, { status: "in_progress" });
      }
    } else if (dto.type === "END") {
      // Dans une version plus complexe on calculerait le temps exact ici, 
      // et on ne mettrait `completed` que si tous les techniciens ont terminé.
      // Pour l'instant, on clôture la mission.
      await InterventionsRepository.update(id, { status: "completed" });
    }

    return log;
  },

  async uploadMedia(id: string, files: Express.Multer.File[], currentUser: JwtPayload) {
    const intervention = await InterventionsService.findById(id, currentUser);
    
    // Check if user is assigned or is manager/admin
    if (currentUser.role === "technician") {
      const isAssigned = intervention.technicians.some((t) => t.userId === currentUser.sub);
      if (!isAssigned) throw AppError.forbidden("Vous n'êtes pas assigné à cette intervention.");
    }

    const uploadedMedia = [];

    for (const file of files) {
      // Generate a unique filename: interventionId/timestamp-random.ext
      const ext = path.extname(file.originalname);
      const uniqueName = `${id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      
      // Upload to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        uniqueName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );

      // Public URL assuming MinIO is accessible at localhost:9000 (adjust if needed in production)
      // Since it's dockerized, we can return the relative path or full URL.
      // The frontend can construct the URL or we store the full MinIO URL.
      // Using /gmao-media/ path for direct access if proxy is setup, or full URL
      const url = `http://localhost:9000/${BUCKET_NAME}/${uniqueName}`;

      // Save to database
      const media = await prisma.interventionMedia.create({
        data: {
          interventionId: id,
          type: "PHOTO",
          url: url,
          filename: file.originalname,
          uploadedById: currentUser.sub,
        },
      });

      uploadedMedia.push(media);
    }

    return uploadedMedia;
  },
};
