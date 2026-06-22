import React, { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const empty = { name: "", company: "", address: "", phone: "", email: "", contact_principal: "", notes: "" };

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const canEdit = ["admin", "responsable"].includes(user.role);

  const load = async () => {
    const r = await api.get("/clients", { params: q ? { q } : {} });
    setClients(r.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  const save = async () => {
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form);
      else await api.post("/clients", form);
      toast.success(editing ? "Client modifié" : "Client créé");
      setOpen(false); setEditing(null); setForm(empty);
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const del = async (id) => {
    if (!window.confirm("Supprimer ce client ?")) return;
    try { await api.delete(`/clients/${id}`); toast.success("Client supprimé"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const edit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setOpen(true); };

  return (
    <div className="space-y-6" data-testid="clients-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Module Clients</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Clients</h1>
          <p className="text-zinc-600 mt-1">{clients.length} client(s) enregistré(s)</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
            <DialogTrigger asChild>
              <Button data-testid="new-client-button" className="rounded-sm bg-[#002FA7] hover:bg-[#002277] h-11">
                <Plus className="w-4 h-4 mr-2" /> Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-sm max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">{editing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["name", "Nom *", "text"], ["company", "Société", "text"],
                  ["email", "Email", "email"], ["phone", "Téléphone", "text"],
                  ["contact_principal", "Contact principal", "text"],
                ].map(([k, l, t]) => (
                  <div key={k}>
                    <Label className="text-xs font-bold uppercase tracking-wider">{l}</Label>
                    <Input data-testid={`client-field-${k}`} type={t} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                           className="mt-2 rounded-sm" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Adresse *</Label>
                  <Input data-testid="client-field-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                         className="mt-2 rounded-sm" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider">Notes</Label>
                  <Textarea data-testid="client-field-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="mt-2 rounded-sm" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="rounded-sm">Annuler</Button>
                <Button data-testid="save-client-button" onClick={save} className="rounded-sm bg-[#002FA7] hover:bg-[#002277]">
                  {editing ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input data-testid="client-search" placeholder="Rechercher par nom, société, email…"
               value={q} onChange={(e) => setQ(e.target.value)}
               className="pl-9 rounded-sm h-11 bg-white" />
      </div>

      <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Société</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Adresse</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Contact</th>
              {canEdit && <th className="text-right px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-zinc-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                Aucun client.
              </td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} data-testid={`client-row-${c.id}`} className="border-b border-zinc-100 hover:bg-zinc-50 transition-fast">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-zinc-600">{c.company || "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-zinc-600">{c.address}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-zinc-600">
                  <div>{c.email}</div>
                  <div className="text-xs text-zinc-500">{c.phone}</div>
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => edit(c)} data-testid={`edit-client-${c.id}`} className="rounded-sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {user.role === "admin" && (
                      <Button variant="ghost" size="sm" onClick={() => del(c.id)} data-testid={`delete-client-${c.id}`} className="rounded-sm text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
