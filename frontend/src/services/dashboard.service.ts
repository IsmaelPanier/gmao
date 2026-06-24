import api from "./api";
import type { DashboardStats } from "@/types";

const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<{ data: DashboardStats }>("/dashboard/stats");
    return data.data;
  },
};

export default DashboardService;
