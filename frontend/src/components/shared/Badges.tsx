import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS, STATUS_DOT_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants";
import type { InterventionStatus, InterventionPriority } from "@/types";

export function StatusBadge({ status, className }: { status: InterventionStatus; className?: string }) {
  return (
    <span className={cn("pill", STATUS_COLORS[status], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT_COLORS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: InterventionPriority; className?: string }) {
  return (
    <span className={cn("pill", PRIORITY_COLORS[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
