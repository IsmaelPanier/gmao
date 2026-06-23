import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ClientsService from "@/services/clients.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Search, Building2, MapPin, Phone, Mail, Filter } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientType, HousingType } from "@/types";

export default function ClientsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "PARTICULIER" as ClientType,
    companyName: "",
    siret: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    housingType: "APPARTEMENT" as HousingType,
  });

  const [typeFilter, setTypeFilter] = useState("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["clients", { q, type: typeFilter }],
    queryFn: () => ClientsService.list({ q, limit: 100, ...(typeFilter !== "ALL" ? { type: typeFilter } : {}) }),
  });

  const createMutation = useMutation({
    mutationFn: ClientsService.create,
    onSuccess: () => {
      toast.success("Client créé");
      setOpen(false);
      setForm({ type: "PARTICULIER", companyName: "", siret: "", firstName: "", lastName: "", phone: "", email: "", address: "", city: "", housingType: "APPARTEMENT" });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const clients = data?.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Annuaire</div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un client..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger><SelectValue placeholder="Tous les types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les types</SelectItem>
            <SelectItem value="PARTICULIER">Particulier</SelectItem>
            <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Adresse</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="p-4 text-center">Chargement...</td></tr>}
              {!isLoading && clients.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Aucun client trouvé</td></tr>}
              {clients.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/clients/${c.id}`} className="hover:underline text-primary">
                      {c.type === "ENTREPRISE" && c.companyName ? c.companyName : `${c.firstName} ${c.lastName}`}
                    </Link>
                    {c.type === "ENTREPRISE" && c.siret && <div className="text-xs text-muted-foreground font-normal">SIRET: {c.siret}</div>}
                    {c.type === "ENTREPRISE" && c.companyName && <div className="text-xs text-muted-foreground font-normal">Contact: {c.firstName} {c.lastName}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted-foreground/20">
                      {c.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
                    </span>
                    {c.housingType && <span className="ml-2 text-xs opacity-70">({c.housingType.toLowerCase()})</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> {c.email}</div>}
                    {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> {c.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground"><div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/> {c.address || "—"} {c.city || ""}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
