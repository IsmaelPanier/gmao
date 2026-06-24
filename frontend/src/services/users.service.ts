import api from "./api";
import type { User, PaginatedResult } from "@/types";

const UsersService = {
  async list(params?: { role?: string; q?: string; page?: number; limit?: number }): Promise<PaginatedResult<User>> {
    const { data } = await api.get<{ data: PaginatedResult<User> }>("/users", { params });
    return data.data;
  },
  async getById(id: string): Promise<User> {
    const { data } = await api.get<{ data: User }>(`/users/${id}`);
    return data.data;
  },
  async create(payload: any): Promise<User> {
    const { data } = await api.post<{ data: User }>("/users", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.patch<{ data: User }>(`/users/${id}`, payload);
    return data.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

export default UsersService;
