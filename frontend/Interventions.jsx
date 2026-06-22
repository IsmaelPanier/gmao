import React, { useEffect, useState } from "react";
import api, { formatApiError, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Filter, ClipboardList } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Interventions() {
  const { user } = useAuth();
  const canCreate = ["admin", "responsable"].includes(user.role);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [techs, setTechs] = useState([]);
  const [filters, setFilters] = useState({ q: "", status_filter: "all", client_id: "all", technician_id: "all" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", address: "", type: "", priority: "moyenne",
    scheduled_date: new Date().toISOString().slice(0, 10), scheduled_time: "09:00",
    duration_estimated: 60, description: "", assigned_technicians: [],
  });

  const load = async () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== "all") params[k] = v; });
    const r = await api.get("/interventions", { params });
    setItems(r.data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);
  useEffect(() => {
    api.get("/clients").then(r => setClients(r.data));
    api.get("/users").then(r => setTechs(r.data.filter(u => u.role === "technicien")));
  }, []);

  const create = async () => {
    try {
      if (!form.client_id) return toast.error("Sélectionnez un client");
      await api.post("/interventions", form);
      toast.success("Intervention créée");
      setOpen(false);
      setForm({ ...form, address: "", type: "", description: "", assigned_technicians: [] });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const toggleTech = (id) => {
    setForm((f) => ({
      ...f,
      assigned_technicians: f.assigned_technicians.includes(id)
        ? f.assigned_technicians.filter(x => x !== id)
        : [...f.assigned_technicians, id],
    }));
  };

  return (
    <div className="space-y-6" data-testid="interventions-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Module Interventions</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Interventions</h1>
          <p className="text-zinc-600 mt-1">{items.length} intervention(s)</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-intervention-button" className="rounded-sm bg-[#002FA7] hover:bg-[#002277] h-11">
                <Plus className="w-4 h-4 mr-2" /> Nouvelle intervention
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-sm max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Créer une intervention</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Client *</Label>
                  <Select value={form.client_id} onValueChange={(v) => {
                    const cli = clients.find(c => c.id === v);
                    setForm({ ...form, client_id: v, address: cli?.address || form.address });
                  }}>
                    <SelectTrigger data-testid="intervention-client" className="mt-2 rounded-sm h-11"><SelectValue placeholder="Sélectionnez…" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.company && `(${c.company})`}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Adresse</Label>
                  <Input data-testid="intervention-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-2 rounded-sm" />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Type *</Label>
                  <Input data-testid="intervention-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                         placeholder="Ex: Maintenance préventive" className="mt-2 rounded-sm" />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Priorité</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="mt-2 rounded-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRIORITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Date</Label>
                  <Input data-testid="intervention-date" type="date" value={form.scheduled_date}
                         onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="mt-2 rounded-sm" />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Heure</Label>
                  <Input type="time" value={form.scheduled_time}
                         onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} className="mt-2 rounded-sm" />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Durée estimée (min)</Label>
                  <Input type="number" value={form.duration_estimated}
                         onChange={(e) => setForm({ ...form, duration_estimated: parseInt(e.target.value) || 0 })} className="mt-2 rounded-sm" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3} className="mt-2 rounded-sm" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-2 block">Techniciens affectés</Label>
                  <div className="flex flex-wrap gap-2">
                    {techs.length === 0 && <span className="text-sm text-zinc-500">Aucun technicien disponible</span>}
                    {techs.map((t) => (
                      <button type="button" key={t.id} onClick={() => toggleTech(t.id)}
                        data-testid={`assign-tech-${t.id}`}
                        className={`px-3 py-1.5 text-sm border rounded-sm transition-fast ${
                          form.assigned_technicians.includes(t.id)
                            ? "bg-[#002FA7] text-white border-[#002FA7]"
                            : "bg-white border-zinc-300 hover:border-zinc-400"
                        }`}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="rounded-sm">Annuler</Button>
                <Button data-testid="save-intervention-button" onClick={create} className="rounded-sm bg-[#002FA7] hover:bg-[#002277]">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input data-testid="intervention-search" placeholder="N°, type, adresse…" value={filters.q}
                 onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="pl-9 rounded-sm bg-white" />
        </div>
        <Select value={filters.status_filter} onValueChange={(v) => setFilters({ ...filters, status_filter: v })}>
          <SelectTrigger className="rounded-sm" data-testid="filter-status"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.client_id} onValueChange={(v) => setFilters({ ...filters, client_id: v })}>
          <SelectTrigger className="rounded-sm"><SelectValue placeholder="Client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.technician_id} onValueChange={(v) => setFilters({ ...filters, technician_id: v })}>
          <SelectTrigger className="rounded-sm"><SelectValue placeholder="Technicien" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les techniciens</SelectItem>
            {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">N°</th>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Priorité</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Technicien(s)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-zinc-500">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                Aucune intervention.
              </td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-fast">
                <td className="px-4 py-3 font-mono text-xs font-semibold">
                  <Link to={`/interventions/${it.id}`} data-testid={`intervention-link-${it.id}`} className="text-[#002FA7] hover:underline">{it.number}</Link>
                </td>
                <td className="px-4 py-3">{it.client?.name || "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell text-zinc-600">{it.type}</td>
                <td className="px-4 py-3 text-zinc-600">{it.scheduled_date} <span className="text-zinc-400">{it.scheduled_time}</span></td>
                <td className="px-4 py-3"><PriorityBadge priority={it.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                <td className="px-4 py-3 hidden lg:table-cell text-zinc-600">
                  {it.technicians?.length ? it.technicians.map(t => t.name).join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
