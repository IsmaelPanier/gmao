// ─── Enums ────────────────────────────────────────────────────
export type Role = "admin" | "manager" | "technician";

export type InterventionStatus =
  | "created"
  | "assigned"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export type InterventionPriority = "low" | "medium" | "high" | "urgent";
export type MediaType = "PHOTO" | "SIGNATURE" | "DOCUMENT";

// ─── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ClientType = "PARTICULIER" | "ENTREPRISE";
export type HousingType = "APPARTEMENT" | "MAISON";

// ─── Client ───────────────────────────────────────────────────
export interface Client {
  id: string;
  type: ClientType;
  companyName?: string | null;
  siret?: string | null;
  firstName: string;
  lastName: string;
  housingType?: HousingType | null;
  email?: string | null;
  phone: string;
  address: string;
  city: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Intervention ─────────────────────────────────────────────
export interface InterventionTechnician {
  id: string;
  userId: string;
  interventionId: string;
  assignedAt: string;
  status: "PENDING" | "ACCEPTED" | "REFUSED";
  user: Pick<User, "id" | "name" | "email" | "phone" | "role">;
}

export interface Intervention {
  id: string;
  number: string;
  type: string;
  description?: string | null;
  address?: string | null;
  status: InterventionStatus;
  priority: InterventionPriority;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  durationEstimated?: number | null;
  durationActual?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  client: Pick<Client, "id" | "type" | "firstName" | "lastName" | "address" | "city" | "phone">;
  createdById: string;
  createdBy: Pick<User, "id" | "name" | "email">;
  technicians: InterventionTechnician[];
  media?: InterventionMedia[];
}

export interface InterventionMedia {
  id: string;
  interventionId: string;
  type: MediaType;
  url: string;
  filename?: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy?: Pick<User, "id" | "name" | "email">;
}

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardStats {
  total: number;
  today: number;
  in_progress: number;
  completed: number;
  pending: number;
  cancelled: number;
  by_status: Array<{ status: InterventionStatus; count: number }>;
  resolution_rate: number;
  avg_duration: number;
  by_month: Array<{ month: string; count: number }>;
  by_technician: Array<{ id: string; name: string; count: number }>;
  team_workload?: Array<{ id: string; name: string; count: number }>;
  recent: Intervention[];
}

// ─── API Types ────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ─── Form types ───────────────────────────────────────────────
export interface CreateInterventionForm {
  type: string;
  description?: string;
  address?: string;
  priority: InterventionPriority;
  scheduledDate?: string;
  scheduledTime?: string;
  durationEstimated?: number;
  clientId: string;
  technicianIds: string[];
  notes?: string;
}

export interface UpdateInterventionForm {
  type?: string;
  description?: string;
  address?: string;
  priority?: InterventionPriority;
  status?: InterventionStatus;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  durationEstimated?: number;
  durationActual?: number;
  notes?: string;
  technicianIds?: string[];
}
