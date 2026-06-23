import api from "./api";
import type { Intervention, PaginatedResult, CreateInterventionForm, UpdateInterventionForm } from "@/types";

export interface InterventionsQuery {
  q?: string;
  status?: string;
  priority?: string;
  clientId?: string;
  technicianId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const InterventionsService = {
  async list(params?: InterventionsQuery): Promise<PaginatedResult<Intervention>> {
    const { data } = await api.get<{ data: PaginatedResult<Intervention> }>("/interventions", { params });
    return data.data;
  },

  async getById(id: string): Promise<Intervention> {
    const { data } = await api.get<{ data: Intervention }>(`/interventions/${id}`);
    return data.data;
  },

  async create(payload: CreateInterventionForm): Promise<Intervention> {
    const { data } = await api.post<{ data: Intervention }>("/interventions", payload);
    return data.data;
  },

  async update(id: string, payload: UpdateInterventionForm): Promise<Intervention> {
    const { data } = await api.patch<{ data: Intervention }>(`/interventions/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/interventions/${id}`);
  },
};

export default InterventionsService;
