import type { InterventionStatus, InterventionPriority, Role } from "@/types";

export const STATUS_LABELS: Record<InterventionStatus, string> = {
  created: "Créée",
  assigned: "Assignée",
  in_progress: "En cours",
  waiting: "En attente",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const STATUS_COLORS: Record<InterventionStatus, string> = {
  created: "bg-zinc-100 text-zinc-700 border-zinc-300",
  assigned: "bg-blue-50 text-blue-800 border-blue-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-300",
  waiting: "bg-orange-50 text-orange-800 border-orange-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200",
};

export const STATUS_DOT_COLORS: Record<InterventionStatus, string> = {
  created: "bg-zinc-400",
  assigned: "bg-blue-500",
  in_progress: "bg-amber-500",
  waiting: "bg-orange-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

export const PRIORITY_LABELS: Record<InterventionPriority, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export const PRIORITY_COLORS: Record<InterventionPriority, string> = {
  low: "bg-zinc-50 text-zinc-600 border-zinc-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  manager: "Responsable",
  technician: "Technicien",
};

export const CHART_COLORS = {
  primary: "#002FA7",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#e11d48",
  info: "#6366f1",
  neutral: "#a1a1aa",
};

export const STATUS_CHART_COLORS: Record<InterventionStatus, string> = {
  created: "#a1a1aa",
  assigned: "#6366f1",
  in_progress: "#f59e0b",
  waiting: "#fb923c",
  completed: "#16a34a",
  cancelled: "#e11d48",
};
