import axios from "axios";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function formatApiError(detail) {
  if (detail == null) return "Une erreur est survenue.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (e?.msg ? e.msg : JSON.stringify(e))).join(" ");
  }
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export const STATUS_LABELS = {
  a_planifier: "À planifier",
  planifiee: "Planifiée",
  en_cours: "En cours",
  en_attente: "En attente",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const STATUS_STYLES = {
  a_planifier: "bg-zinc-100 text-zinc-700 border-zinc-300",
  planifiee: "bg-indigo-50 text-indigo-800 border-indigo-200",
  en_cours: "bg-amber-100 text-amber-900 border-amber-300",
  en_attente: "bg-orange-50 text-orange-800 border-orange-200",
  terminee: "bg-emerald-50 text-emerald-800 border-emerald-200",
  annulee: "bg-rose-50 text-rose-800 border-rose-200",
};

export const PRIORITY_LABELS = {
  faible: "Faible",
  moyenne: "Moyenne",
  haute: "Haute",
  urgente: "Urgente",
};

export const PRIORITY_STYLES = {
  faible: "bg-zinc-50 text-zinc-700 border-zinc-200",
  moyenne: "bg-blue-50 text-blue-800 border-blue-200",
  haute: "bg-orange-50 text-orange-800 border-orange-200",
  urgente: "bg-rose-50 text-rose-800 border-rose-200",
};

export const ROLE_LABELS = {
  admin: "Administrateur",
  responsable: "Responsable",
  technicien: "Technicien",
  client: "Client",
};

export default api;
