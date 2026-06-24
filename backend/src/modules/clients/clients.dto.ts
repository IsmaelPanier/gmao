import { z } from "zod";
import { ClientType, HousingType } from "@prisma/client";

const clientBaseSchema = z.object({
  type: z.nativeEnum(ClientType).default(ClientType.PARTICULIER),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  companyName: z.string().optional(),
  siret: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(2, "Phone is required"),
  address: z.string().min(2, "Address is required"),
  city: z.string().min(2, "City is required"),
  housingType: z.nativeEnum(HousingType).optional().nullable(),
  notes: z.string().optional(),
});

export const createClientSchema = clientBaseSchema.superRefine((data, ctx) => {
  if (data.type === ClientType.ENTREPRISE && !data.companyName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company name is required for enterprises",
      path: ["companyName"],
    });
  }
});

export const updateClientSchema = clientBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const listClientsSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["PARTICULIER", "ENTREPRISE"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
export type ListClientsQuery = z.infer<typeof listClientsSchema>;
