import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InterventionsService from "@/services/interventions.service";
import UsersService from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { formatDate, formatDuration } from "@/lib/utils";
import { getApiError } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Clock, User, Calendar, Edit2, Trash2, Users } from "lucide-react";
import type { InterventionStatus } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
import { InterventionPhotos } from "./components/InterventionPhotos";

// Status transition map (mirrors backend)
const ALLOWED_TRANSITIONS: Record<InterventionStatus, InterventionStatus[]> = {
  created: ["assigned", "cancelled"],
  assigned: ["in_progress", "waiting", "cancelled"],
  in_progress: ["waiting", "completed", "cancelled"],
  waiting: ["in_progress", "assigned", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function InterventionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isManager = ["admin", "manager"].includes(user?.role ?? "");

  const [notes, setNotes] = useState("");
  const [editNotes, setEditNotes] = useState(false);

  const { data: intervention, isLoading } = useQuery({
    queryKey: ["intervention", id],
    queryFn: () => InterventionsService.getById(id!),
    enabled: !!id,
  });

  const { data: techs } = useQuery({
    queryKey: ["users-techs"],
    queryFn: () => UsersService.list({ role: "technician", limit: 100 }),
    enabled: isManager,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof InterventionsService.update>[1]) =>
      InterventionsService.update(id!, payload),
    onSuccess: (data) => {
      toast.success("Intervention mise à jour");
      qc.setQueryData(["intervention", id], data);
      qc.invalidateQueries({ queryKey: ["interventions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setEditNotes(false);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => InterventionsService.delete(id!),
    onSuccess: () => {
      toast.success("Intervention supprimée");
      navigate("/interventions", { replace: true });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 skeleton rounded" />
        <div className="h-64 skeleton rounded-lg" />
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground mb-4">Intervention introuvable</div>
        <Link to="/interventions"><Button variant="outline">Retour à la liste</Button></Link>
      </div>
    );
  }

  const allowedStatuses = ALLOWED_TRANSITIONS[intervention.status];
  const assignedTechIds = intervention.technicians.map((t) => t.userId);

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link to="/interventions" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux interventions
        </Link>
        {isManager && (
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm("Supprimer cette intervention ?")) deleteMutation.mutate();
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Supprimer
          </Button>
        )}
      </div>

      {/* Main card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="font-mono text-xs text-muted-foreground mb-1">{intervention.number}</div>
            <h1 className="text-2xl font-bold">{intervention.type}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={intervention.status} />
              <PriorityBadge priority={intervention.priority} />
            </div>
          </div>

          {/* Status update (Managers only) */}
          {allowedStatuses.length > 0 && isManager && (
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <Label className="text-xs font-bold uppercase tracking-wider">Changer le statut</Label>
              <Select
                disabled={updateMutation.isPending}
                onValueChange={(v) => updateMutation.mutate({ status: v as InterventionStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Technician Action Buttons */}
          {user?.role === "technician" && (
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const myAssignment = intervention.technicians.find(t => t.userId === user.id);
                if (!myAssignment) return null;

                if (myAssignment.status === "PENDING") {
                  return (
                    <>
                      <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => InterventionsService.refuse(id!).then(() => { toast.success("Mission refusée"); qc.invalidateQueries({ queryKey: ["intervention", id] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); })}>Refuser</Button>
                      <Button onClick={() => InterventionsService.accept(id!).then(() => { toast.success("Mission acceptée"); qc.invalidateQueries({ queryKey: ["intervention", id] }); })}>Accepter la mission</Button>
                    </>
                  );
                }

                if (myAssignment.status === "ACCEPTED") {
                  if (intervention.status === "assigned" || intervention.status === "waiting") {
                     return <Button onClick={() => InterventionsService.timeLog(id!, "START").then(() => { toast.success("Intervention démarrée"); qc.invalidateQueries({ queryKey: ["intervention", id] }); })}>▶ Démarrer l'intervention</Button>;
                  }
                  if (intervention.status === "in_progress") {
                     // In a real app we'd query the latest log type, here we just allow pausing or finishing
                     return (
                       <>
                         <Button variant="secondary" onClick={() => InterventionsService.timeLog(id!, "PAUSE").then(() => { toast.success("Intervention en pause"); qc.invalidateQueries({ queryKey: ["intervention", id] }); })}>⏸ Pause</Button>
                         <Button onClick={() => InterventionsService.timeLog(id!, "END").then(() => { toast.success("Intervention terminée"); qc.invalidateQueries({ queryKey: ["intervention", id] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); })}>⏹ Terminer</Button>
                       </>
                     );
                  }
                }
                return null;
              })()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date planifiée
            </div>
            <div className="text-sm font-medium">{formatDate(intervention.scheduledDate)} {intervention.scheduledTime}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Durée estimée
            </div>
            <div className="text-sm font-medium">{formatDuration(intervention.durationEstimated)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Créée par
            </div>
            <div className="text-sm font-medium">{intervention.createdBy.name}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Adresse
            </div>
            <div className="text-sm font-medium">{intervention.address || "—"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Client</div>
          <div className="font-semibold">{intervention.client.firstName} {intervention.client.lastName}</div>
          <div className="text-sm text-muted-foreground">{intervention.client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}</div>
          {intervention.client.address && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-2">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {intervention.client.address}{intervention.client.city ? `, ${intervention.client.city}` : ""}
            </div>
          )}
          {intervention.client.phone && <div className="text-sm text-muted-foreground mt-1">{intervention.client.phone}</div>}
        </div>

        {/* Technicians */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Techniciens assignés
          </div>
          {intervention.technicians.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucun technicien assigné</div>
          ) : (
            <div className="space-y-2">
              {intervention.technicians.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {t.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.user.name}</div>
                    {t.user.phone && <div className="text-xs text-muted-foreground">{t.user.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isManager && techs && (
            <div className="mt-4 pt-3 border-t border-border">
              <Label className="text-xs font-bold uppercase tracking-wider mb-2 block">Modifier les techniciens</Label>
              <div className="flex flex-wrap gap-1.5">
                {techs.data.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const ids = assignedTechIds.includes(t.id)
                        ? assignedTechIds.filter((x) => x !== t.id)
                        : [...assignedTechIds, t.id];
                      updateMutation.mutate({ technicianIds: ids });
                    }}
                    disabled={updateMutation.isPending}
                    className={`px-2.5 py-1 text-xs border rounded-md transition-colors ${
                      assignedTechIds.includes(t.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description + Notes */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        {intervention.description && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</div>
            <p className="text-sm leading-relaxed text-foreground/80">{intervention.description}</p>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes terrain</div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditNotes(!editNotes); setNotes(intervention.notes ?? ""); }}>
              <Edit2 className="w-3 h-3 mr-1" /> {editNotes ? "Annuler" : "Modifier"}
            </Button>
          </div>
          {editNotes ? (
            <div className="space-y-2">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Ajoutez des notes…" />
              <Button size="sm" onClick={() => updateMutation.mutate({ notes })} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-foreground/80">{intervention.notes || <span className="text-muted-foreground italic">Aucune note</span>}</p>
          )}
        </div>
      </div>

      {/* Media Upload */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <InterventionPhotos 
          interventionId={id!} 
          media={intervention.media || []} 
          canEdit={true} // Tous les rôles peuvent voir l'UI pour l'instant (à affiner selon les besoins)
        />
      </div>

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground flex gap-4">
        <span>Créée le {formatDate(intervention.createdAt, "dd/MM/yyyy HH:mm")}</span>
        <span>Modifiée le {formatDate(intervention.updatedAt, "dd/MM/yyyy HH:mm")}</span>
      </div>
    </div>
  );
}
