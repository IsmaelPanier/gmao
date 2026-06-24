import api from "./api";
import type { Client, PaginatedResult } from "@/types";

const ClientsService = {
  async list(params?: { q?: string; page?: number; limit?: number }): Promise<PaginatedResult<Client>> {
    const { data } = await api.get<{ data: PaginatedResult<Client> }>("/clients", { params });
    return data.data;
  },
  async getById(id: string): Promise<Client> {
    const { data } = await api.get<{ data: Client }>(`/clients/${id}`);
    return data.data;
  },
  async create(payload: Partial<Client>): Promise<Client> {
    const { data } = await api.post<{ data: Client }>("/clients", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<Client>): Promise<Client> {
    const { data } = await api.patch<{ data: Client }>(`/clients/${id}`, payload);
    return data.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};

export default ClientsService;
