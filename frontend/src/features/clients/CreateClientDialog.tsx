import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ClientsService from "@/services/clients.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import { ClientType, HousingType } from "@/types";

interface Props {
  onSuccess?: (clientId: string) => void;
  trigger?: React.ReactNode;
}

export function CreateClientDialog({ onSuccess, trigger }: Props) {
  const qc = useQueryClient();
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

  const createMutation = useMutation({
    mutationFn: ClientsService.create,
    onSuccess: (newClient) => {
      toast.success("Client créé");
      setOpen(false);
      setForm({ type: "PARTICULIER", companyName: "", siret: "", firstName: "", lastName: "", phone: "", email: "", address: "", city: "", housingType: "APPARTEMENT" });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-select"] });
      if (onSuccess) onSuccess(newClient.id);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl z-[60]">
        <DialogHeader>
          <DialogTitle>Créer un client</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Type de client *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="type" value="PARTICULIER" checked={form.type === "PARTICULIER"} onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })} className="accent-primary" />
                Particulier
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="type" value="ENTREPRISE" checked={form.type === "ENTREPRISE"} onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })} className="accent-primary" />
                Entreprise
              </label>
            </div>
          </div>
          
          {form.type === "ENTREPRISE" && (
            <>
              <div className="space-y-1.5">
                <Label>Raison Sociale *</Label>
                <Input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SIRET</Label>
                <Input value={form.siret || ""} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Prénom (Contact) *</Label>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Nom (Contact) *</Label>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          
          <div className="space-y-1.5">
            <Label>Téléphone *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Adresse *</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Ville *</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>

          {form.type === "PARTICULIER" && (
            <div className="sm:col-span-2 space-y-1.5 mt-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Label>Type de logement</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="housingType" value="APPARTEMENT" checked={form.housingType === "APPARTEMENT"} onChange={(e) => setForm({ ...form, housingType: e.target.value as HousingType })} className="accent-primary" />
                  Appartement
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="housingType" value="MAISON" checked={form.housingType === "MAISON"} onChange={(e) => setForm({ ...form, housingType: e.target.value as HousingType })} className="accent-primary" />
                  Maison
                </label>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.firstName || !form.lastName || !form.phone}>
            {createMutation.isPending ? "Création…" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
