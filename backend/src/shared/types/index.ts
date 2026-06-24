import { Role } from "@prisma/client";

// ─── Auth ─────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── Express augmentation ─────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Helpers ──────────────────────────────────────────────────
export const success = <T>(data: T, message?: string): ApiSuccess<T> => ({
  success: true,
  data,
  message,
});
