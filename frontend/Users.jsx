import React, { useEffect, useState } from "react";
import api, { formatApiError, ROLE_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "technicien", phone: "" });

  const load = async () => { const r = await api.get("/users"); setUsers(r.data); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await api.post("/users", form); toast.success("Utilisateur créé"); setOpen(false);
      setForm({ email: "", password: "", name: "", role: "technicien", phone: "" }); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const del = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try { await api.delete(`/users/${id}`); toast.success("Supprimé"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Administration</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-zinc-600 mt-1">{users.length} compte(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-user-button" className="rounded-sm bg-[#002FA7] hover:bg-[#002277] h-11">
              <Plus className="w-4 h-4 mr-2" /> Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader><DialogTitle className="font-display">Nouvel utilisateur</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs font-bold uppercase tracking-wider">Nom *</Label>
                <Input data-testid="user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 rounded-sm" /></div>
              <div><Label className="text-xs font-bold uppercase tracking-wider">Email *</Label>
                <Input data-testid="user-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 rounded-sm" /></div>
              <div><Label className="text-xs font-bold uppercase tracking-wider">Mot de passe *</Label>
                <Input data-testid="user-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 rounded-sm" /></div>
              <div><Label className="text-xs font-bold uppercase tracking-wider">Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 rounded-sm" /></div>
              <div className="sm:col-span-2"><Label className="text-xs font-bold uppercase tracking-wider">Rôle</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="user-role" className="mt-2 rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROLE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-sm">Annuler</Button>
              <Button onClick={create} data-testid="save-user-button" className="rounded-sm bg-[#002FA7] hover:bg-[#002277]">Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr><th className="text-left px-4 py-3">Nom</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Rôle</th><th className="text-right px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="pill bg-zinc-100 text-zinc-700 border-zinc-300">{ROLE_LABELS[u.role]}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me.id && (
                    <Button variant="ghost" size="sm" onClick={() => del(u.id)} data-testid={`delete-user-${u.id}`} className="rounded-sm text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
