import api from "./api";
import type { User } from "@/types";

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; name: string; role?: string; phone?: string; }

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const AuthService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<{ data: AuthResponse }>("/auth/login", payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await api.post<{ data: User }>("/auth/register", payload);
    return data.data;
  },

  async refresh(refreshToken: string) {
    const { data } = await api.post<{ data: { accessToken: string; refreshToken: string } }>("/auth/refresh", { refreshToken });
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken });
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ data: User }>("/auth/me");
    return data.data;
  },
};

export default AuthService;
