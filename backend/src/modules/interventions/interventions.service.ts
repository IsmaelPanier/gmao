import { AppError } from "../../shared/errors/AppError";
import { InterventionsRepository } from "./interventions.repository";
import { CreateInterventionDto, ListInterventionsQuery, UpdateInterventionDto } from "./interventions.dto";
import { JwtPayload } from "../../shared/types";
import { InterventionStatus } from "@prisma/client";

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
    return InterventionsRepository.create(dto, currentUser.sub, number);
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

    return InterventionsRepository.update(id, dto);
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
};
