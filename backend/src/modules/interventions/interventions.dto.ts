import { z } from "zod";

export const createInterventionSchema = z.object({
  type: z.string().min(2, "Type is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  durationEstimated: z.coerce.number().int().min(0).optional(),
  clientId: z.string().uuid("Invalid client ID"),
  technicianIds: z.array(z.string().uuid()).optional().default([]),
  notes: z.string().optional(),
});

export const updateInterventionSchema = z.object({
  type: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["created", "assigned", "in_progress", "waiting", "completed", "cancelled"]).optional(),
  scheduledDate: z.string().nullable().optional(),
  scheduledTime: z.string().nullable().optional(),
  durationEstimated: z.coerce.number().int().min(0).optional(),
  durationActual: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  technicianIds: z.array(z.string().uuid()).optional(),
});

export const listInterventionsSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  clientId: z.string().optional(),
  technicianId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["scheduledDate", "priority", "status", "createdAt", "updatedAt"]).default("scheduledDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateInterventionDto = z.infer<typeof createInterventionSchema>;
export type UpdateInterventionDto = z.infer<typeof updateInterventionSchema>;
export type ListInterventionsQuery = z.infer<typeof listInterventionsSchema>;

export const timeLogSchema = z.object({
  type: z.enum(["START", "PAUSE", "RESUME", "END"]),
});
export type TimeLogDto = z.infer<typeof timeLogSchema>;
