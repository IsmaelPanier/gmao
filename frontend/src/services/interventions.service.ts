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

  async accept(id: string): Promise<void> {
    await api.post(`/interventions/${id}/accept`);
  },

  async refuse(id: string): Promise<void> {
    await api.post(`/interventions/${id}/refuse`);
  },

  async timeLog(id: string, type: "START" | "PAUSE" | "RESUME" | "END"): Promise<void> {
    await api.post(`/interventions/${id}/time-log`, { type });
  },

  async uploadMedia(id: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    await api.post(`/interventions/${id}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default InterventionsService;
