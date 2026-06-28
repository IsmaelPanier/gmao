import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import api from "@/services/api";
import { Clock, X } from "lucide-react";

interface Props {
  technicianIds: string[];
  interventionNumber: string;
  interventionId: string;
  message?: string;
}

const DELAY_OPTIONS = [
  { label: "Immédiatement", minutes: 0 },
  { label: "Dans 3 minutes", minutes: 3 },
  { label: "Dans 10 minutes", minutes: 10 },
  { label: "Dans 30 minutes", minutes: 30 },
];

export function DelayedNotificationButton({ technicianIds, interventionNumber, interventionId, message }: Props) {
  const [pendingJobIds, setPendingJobIds] = useState<string[]>([]);

  const scheduleMutation = useMutation({
    mutationFn: async ({ minutes }: { minutes: number }) => {
      const results: string[] = [];
      for (const userId of technicianIds) {
        if (minutes === 0) {
          await api.post("/notifications/schedule", {
            userId,
            title: `Mission ${interventionNumber}`,
            message: message || `Rappel pour l'intervention ${interventionNumber}`,
            link: `/interventions/${interventionId}`,
            type: "INFO",
            delayMinutes: 0.01, // ~1s pour "immédiat" via le même chemin
          });
        } else {
          const { data } = await api.post("/notifications/schedule", {
            userId,
            title: `Mission ${interventionNumber}`,
            message: message || `Rappel pour l'intervention ${interventionNumber}`,
            link: `/interventions/${interventionId}`,
            type: "INFO",
            delayMinutes: minutes,
          });
          results.push(data.data.jobId);
        }
      }
      return results;
    },
    onSuccess: (jobIds, { minutes }) => {
      if (minutes === 0) {
        toast.success(`Notification envoyée aux ${technicianIds.length} technicien(s)`);
      } else {
        toast.success(`Notification programmée dans ${minutes} min pour ${technicianIds.length} technicien(s)`);
        setPendingJobIds((prev) => [...prev, ...jobIds]);
      }
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/notifications/scheduled/${jobId}`);
      return jobId;
    },
    onSuccess: (jobId) => {
      toast.success("Notification annulée");
      setPendingJobIds((prev) => prev.filter((id) => id !== jobId));
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (technicianIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={scheduleMutation.isPending}>
            <Clock className="w-3.5 h-3.5" />
            Notifier les techniciens
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Choisir le délai d'envoi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DELAY_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.minutes}
              onClick={() => scheduleMutation.mutate({ minutes: opt.minutes })}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {pendingJobIds.map((jobId) => (
        <button
          key={jobId}
          onClick={() => cancelMutation.mutate(jobId)}
          className="flex items-center gap-1 text-xs text-amber-600 border border-amber-300 rounded px-2 py-1 hover:bg-amber-50 transition-colors"
          title="Annuler cette notification programmée"
        >
          <Clock className="w-3 h-3" />
          Programmée
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
