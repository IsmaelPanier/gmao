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
import {
  Plus, Search, ClipboardList, ExternalLink,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ChevronsUpDown, X, SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import type { InterventionPriority } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
import { CreateClientDialog } from "@/features/clients/CreateClientDialog";

const PAGE_SIZE = 20;

type SortBy = "scheduledDate" | "priority" | "status" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

const DEFAULT_FILTERS = {
  q: "",
  status: "active",
  priority: "all",
  clientId: "all",
  technicianId: "all",
  dateFrom: "",
  dateTo: "",
  sortBy: "scheduledDate" as SortBy,
  sortOrder: "asc" as SortOrder,
  page: 1,
};

function SortIcon({ field, current, order }: { field: SortBy; current: SortBy; order: SortOrder }) {
  if (field !== current) return <ChevronsUpDown className="w-3 h-3 ml-1 text-muted-foreground/40" />;
  return order === "asc"
    ? <ChevronUp className="w-3 h-3 ml-1 text-primary" />
    : <ChevronDown className="w-3 h-3 ml-1 text-primary" />;
}

export default function InterventionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canCreate = ["admin", "manager"].includes(user?.role ?? "");
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "active",
    priority: searchParams.get("priority") || "all",
    clientId: searchParams.get("clientId") || "all",
    technicianId: searchParams.get("technicianId") || "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    sortBy: (searchParams.get("sortBy") || "scheduledDate") as SortBy,
    sortOrder: (searchParams.get("sortOrder") || "asc") as SortOrder,
    page: parseInt(searchParams.get("page") || "1", 10) || 1,
  });

  React.useEffect(() => {
    setFilters({
      q: searchParams.get("q") || "",
      status: searchParams.get("status") || "active",
      priority: searchParams.get("priority") || "all",
      clientId: searchParams.get("clientId") || "all",
      technicianId: searchParams.get("technicianId") || "all",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
      sortBy: (searchParams.get("sortBy") || "scheduledDate") as SortBy,
      sortOrder: (searchParams.get("sortOrder") || "asc") as SortOrder,
      page: parseInt(searchParams.get("page") || "1", 10) || 1,
    });
  }, [searchParams]);

  const updateFilter = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    if (key !== "page") newFilters.page = 1;
    applyFilters(newFilters);
  };

  const applyFilters = (f: typeof filters) => {
    const newParams = new URLSearchParams();
    if (f.q) newParams.set("q", f.q);
    if (f.status !== "active") newParams.set("status", f.status);
    if (f.priority !== "all") newParams.set("priority", f.priority);
    if (f.clientId !== "all") newParams.set("clientId", f.clientId);
    if (f.technicianId !== "all") newParams.set("technicianId", f.technicianId);
    if (f.dateFrom) newParams.set("dateFrom", f.dateFrom);
    if (f.dateTo) newParams.set("dateTo", f.dateTo);
    if (f.sortBy !== "scheduledDate") newParams.set("sortBy", f.sortBy);
    if (f.sortOrder !== "asc") newParams.set("sortOrder", f.sortOrder);
    if (f.page > 1) newParams.set("page", f.page.toString());
    setSearchParams(newParams);
  };

  const toggleSort = (field: SortBy) => {
    const newOrder: SortOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    const newFilters = { ...filters, sortBy: field, sortOrder: newOrder, page: 1 };
    applyFilters(newFilters);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Count active non-default filters (excludes q and status=active which are "soft" defaults)
  const activeFilterCount = [
    filters.q !== "",
    filters.status !== "active",
    filters.priority !== "all",
    filters.clientId !== "all",
    filters.technicianId !== "all",
    filters.dateFrom !== "",
    filters.dateTo !== "",
  ].filter(Boolean).length;

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
    ...(filters.technicianId !== "all" && { technicianId: filters.technicianId }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: filters.page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["interventions", queryParams],
    queryFn: () => InterventionsService.list(queryParams),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: () => ClientsService.list({ limit: 200 }),
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

  const SortableTh = ({ field, label, className = "" }: { field: SortBy; label: string; className?: string }) => (
    <th
      className={`text-left px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon field={field} current={filters.sortBy} order={filters.sortOrder} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="interventions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Module</div>
          <h1 className="text-3xl font-bold tracking-tight">Interventions</h1>
          <p className="text-muted-foreground mt-1">
            {total} intervention(s) trouvée(s)
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
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
      </div>

      {/* Search bar — always visible */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="intervention-search"
          placeholder="Rechercher par N°, type, adresse, nom du client…"
          value={filters.q}
          onChange={(e) => updateFilter("q", e.target.value)}
          className="pl-9 pr-4"
        />
        {filters.q && (
          <button
            onClick={() => updateFilter("q", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Filtres avancés</h2>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Réinitialiser tout
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Statut */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                <SelectTrigger id="filter-status"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Interventions actives</SelectItem>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Priorité */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priorité</Label>
              <Select value={filters.priority} onValueChange={(v) => updateFilter("priority", v)}>
                <SelectTrigger id="filter-priority"><SelectValue placeholder="Priorité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  {Object.entries(PRIORITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Technicien */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Technicien</Label>
              <Select value={filters.technicianId} onValueChange={(v) => updateFilter("technicianId", v)}>
                <SelectTrigger id="filter-technician"><SelectValue placeholder="Technicien" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les techniciens</SelectItem>
                  {techs?.data.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <Select value={filters.clientId} onValueChange={(v) => updateFilter("clientId", v)}>
                <SelectTrigger id="filter-client"><SelectValue placeholder="Client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients?.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date de début */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date à partir du</Label>
              <div className="relative">
                <Input
                  id="filter-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                />
                {filters.dateFrom && (
                  <button onClick={() => updateFilter("dateFrom", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Date de fin */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date jusqu'au</Label>
              <div className="relative">
                <Input
                  id="filter-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                />
                {filters.dateTo && (
                  <button onClick={() => updateFilter("dateTo", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              {filters.status !== "active" && filters.status !== "" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  Statut : {STATUS_LABELS[filters.status as keyof typeof STATUS_LABELS] ?? filters.status}
                  <button onClick={() => updateFilter("status", "active")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.priority !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  Priorité : {PRIORITY_LABELS[filters.priority as keyof typeof PRIORITY_LABELS]}
                  <button onClick={() => updateFilter("priority", "all")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.technicianId !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  Tech : {techs?.data.find((t) => t.id === filters.technicianId)?.name ?? "…"}
                  <button onClick={() => updateFilter("technicianId", "all")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.clientId !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  Client : {(() => { const c = clients?.data.find((c) => c.id === filters.clientId); return c ? `${c.firstName} ${c.lastName}` : "…"; })()}
                  <button onClick={() => updateFilter("clientId", "all")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.dateFrom && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  À partir du : {filters.dateFrom}
                  <button onClick={() => updateFilter("dateFrom", "")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  Jusqu'au : {filters.dateTo}
                  <button onClick={() => updateFilter("dateTo", "")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.q && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                  Recherche : "{filters.q}"
                  <button onClick={() => updateFilter("q", "")}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-3">N°</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
                <SortableTh field="scheduledDate" label="Date" />
                <SortableTh field="priority" label="Priorité" />
                <SortableTh field="status" label="Statut" />
                <th className="text-left px-4 py-3 hidden lg:table-cell text-muted-foreground">Technicien(s)</th>
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
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="mt-3 text-xs text-primary hover:underline">
                      Réinitialiser les filtres
                    </button>
                  )}
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
            <span className="text-xs text-muted-foreground">Page {filters.page} / {totalPages} — {total} résultat(s)</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => updateFilter("page", filters.page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={filters.page >= totalPages} onClick={() => updateFilter("page", filters.page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
