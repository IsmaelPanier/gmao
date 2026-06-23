import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import InterventionsService from "@/services/interventions.service";
import ClientsService from "@/services/clients.service";
import UsersService from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { getApiError } from "@/services/api";
import { formatDate as fmt } from "@/lib/utils";
import { Plus, Search, ClipboardList, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { InterventionPriority } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
import { CreateClientDialog } from "@/features/clients/CreateClientDialog";

const PAGE_SIZE = 20;

export default function InterventionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canCreate = ["admin", "manager"].includes(user?.role ?? "");

  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "active",
    priority: searchParams.get("priority") || "all",
    clientId: searchParams.get("clientId") || "all",
    date: searchParams.get("date") || "",
    page: 1,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "", description: "", address: "",
    priority: "medium" as InterventionPriority,
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    durationEstimated: 60,
    clientId: "", technicianIds: [] as string[], notes: "",
  });

  const queryParams = {
    ...(filters.q && { q: filters.q }),
    ...(filters.status !== "all" && { status: filters.status }),
    ...(filters.priority !== "all" && { priority: filters.priority }),
    ...(filters.clientId !== "all" && { clientId: filters.clientId }),
    ...(filters.date && { dateFrom: filters.date, dateTo: filters.date }),
    page: filters.page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["interventions", queryParams],
    queryFn: () => InterventionsService.list(queryParams),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: () => ClientsService.list({ limit: 100 }),
  });

  const { data: techs } = useQuery({
    queryKey: ["users-techs"],
    queryFn: () => UsersService.list({ role: "technician", limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: InterventionsService.create,
    onSuccess: () => {
      toast.success("Intervention créée");
      setOpen(false);
      setForm({ ...form, type: "", description: "", address: "", notes: "", technicianIds: [], clientId: "" });
      qc.invalidateQueries({ queryKey: ["interventions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const toggleTech = (id: string) => {
    setForm((f) => ({
      ...f,
      technicianIds: f.technicianIds.includes(id)
        ? f.technicianIds.filter((x) => x !== id)
        : [...f.technicianIds, id],
    }));
  };

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="interventions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Module</div>
          <h1 className="text-3xl font-bold tracking-tight">Interventions</h1>
          <p className="text-muted-foreground mt-1">{total} intervention(s) trouvée(s)</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nouvelle intervention
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une intervention</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Client *</Label>
                    <CreateClientDialog 
                      onSuccess={(id) => {
                        const cli = clients?.data.find((c) => c.id === id);
                        setForm({ ...form, clientId: id, address: cli?.address || "" });
                      }}
                    />
                  </div>
                  <Select value={form.clientId} onValueChange={(v) => {
                    const cli = clients?.data.find((c) => c.id === v);
                    setForm({ ...form, clientId: v, address: cli?.address || "" });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez un client…" /></SelectTrigger>
                    <SelectContent>
                      {clients?.data.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.type === "ENTREPRISE" ? "Entreprise" : "Particulier"})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Type d'intervention *</Label>
                  <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Ex: Maintenance préventive HVAC" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Adresse</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse du site" />
                </div>
                <div className="space-y-1.5">
                  <Label>Priorité</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as InterventionPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Durée estimée (min)</Label>
                  <Input type="number" min={0} value={form.durationEstimated} onChange={(e) => setForm({ ...form, durationEstimated: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date planifiée</Label>
                  <Input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure</Label>
                  <Input type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Détails de l'intervention…" />
                </div>
                {techs && techs.data.length > 0 && (
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Techniciens assignés (Optionnel pour planifier)</Label>
                    <div className="flex flex-wrap gap-2">
                      {techs.data.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTech(t.id)}
                          className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                            form.technicianIds.includes(t.id)
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={createMutation.isPending || !form.clientId || !form.type}
                >
                  {createMutation.isPending ? "Création…" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="N°, type, adresse…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
            className="pl-9"
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 })}>
          <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Interventions actives</SelectItem>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v, page: 1 })}>
          <SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorités</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input 
          type="date" 
          value={filters.date} 
          onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })} 
          className="w-full text-muted-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-3">N°</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Priorité</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Technicien(s)</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              )}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <div className="font-medium">Aucune intervention trouvée</div>
                  <div className="text-xs mt-1">Modifiez vos filtres ou créez une nouvelle intervention</div>
                </td></tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/interventions/${it.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                      {it.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{it.client ? `${it.client.firstName} ${it.client.lastName}` : "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground truncate max-w-[200px]">{it.type}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {fmt(it.scheduledDate)}
                    {it.scheduledTime && <span className="text-muted-foreground/60 ml-1">{it.scheduledTime}</span>}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={it.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {it.technicians.length ? it.technicians.map((t) => t.user.name).join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/interventions/${it.id}`} className="p-1 hover:text-primary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {filters.page} / {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={filters.page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
