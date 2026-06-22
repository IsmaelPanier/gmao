import React from "react";
import { STATUS_LABELS, STATUS_STYLES, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/api";

export function StatusBadge({ status }) {
  return (
    <span className={`pill ${STATUS_STYLES[status] || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}
          data-testid={`status-badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`pill ${PRIORITY_STYLES[priority] || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}
          data-testid={`priority-badge-${priority}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
