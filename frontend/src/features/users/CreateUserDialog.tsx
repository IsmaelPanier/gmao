import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import UsersService from "@/services/users.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import { Plus } from "lucide-react";

const PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

export function CreateUserDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "technician",
  });
  const [phoneError, setPhoneError] = useState("");

  const createMutation = useMutation({
    mutationFn: UsersService.create,
    onSuccess: () => {
      toast.success("Utilisateur créé");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "", role: "technician" });
      setPhoneError("");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users-techs"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const [emailError, setEmailError] = useState("");

  const handlePhoneChange = (val: string) => {
    // Autoriser uniquement les chiffres, espaces, tirets, points et le + initial
    let newVal = val.replace(/[^\d\s.\-+]/g, "");
    
    // Compter uniquement les vrais chiffres
    const digitsOnly = newVal.replace(/\D/g, "");
    const hasPlus = newVal.startsWith("+");
    
    // Limiter strictement à 10 chiffres (ou 11 si +33)
    const maxDigits = hasPlus ? 11 : 10;
    if (digitsOnly.length > maxDigits) {
      return; // Bloque la frappe si on dépasse
    }

    setForm({ ...form, phone: newVal });
    if (newVal && !PHONE_REGEX.test(newVal)) {
      setPhoneError("Numéro français invalide (ex: 0612345678 ou +336...)");
    } else {
      setPhoneError("");
    }
  };

  const handleEmailChange = (val: string) => {
    setForm({ ...form, email: val });
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("Format d'email invalide");
    } else {
      setEmailError("");
    }
  };

  const isFormValid = form.name.length >= 2 && form.email.includes("@") && !emailError && form.password.length >= 6 && !phoneError;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Créer un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label>Nom complet *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input 
              type="email" 
              value={form.email} 
              onChange={(e) => handleEmailChange(e.target.value)} 
              placeholder="email@exemple.fr" 
              className={emailError ? "border-destructive" : ""}
            />
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Mot de passe initial *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 caractères" />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone (Optionnel)</Label>
            <Input 
              value={form.phone} 
              onChange={(e) => handlePhoneChange(e.target.value)} 
              placeholder="06 12 34 56 78" 
              className={phoneError ? "border-destructive" : ""}
            />
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Rôle *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="technician">Technicien</SelectItem>
                <SelectItem value="manager">Manager / Planificateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button 
            onClick={() => createMutation.mutate(form)} 
            disabled={createMutation.isPending || !isFormValid}
          >
            {createMutation.isPending ? "Création..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
