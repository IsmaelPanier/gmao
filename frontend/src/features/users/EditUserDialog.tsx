import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import UsersService from "@/services/users.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import { z } from "zod";
import type { User } from "@/types";

const phoneSchema = z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Format français invalide (ex: 0612345678)").optional().or(z.literal(""));
const emailSchema = z.string().email("Email invalide");

export function EditUserDialog({ user }: { user: User }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    isActive: user.isActive,
  });

  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        isActive: user.isActive,
      });
      setPhoneError("");
      setEmailError("");
    }
  }, [open, user]);

  const handlePhoneChange = (val: string) => {
    // Garder seulement les chiffres et le +, max 12 caractères
    const cleaned = val.replace(/[^\d+]/g, "").slice(0, 12);
    // Si commence par 0, max 10
    const finalVal = cleaned.startsWith("0") ? cleaned.slice(0, 10) : cleaned;
    
    setForm({ ...form, phone: finalVal });
    
    if (finalVal.length > 0) {
      const res = phoneSchema.safeParse(finalVal);
      if (!res.success) {
        setPhoneError(res.error.errors[0].message);
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  };

  const handleEmailChange = (val: string) => {
    setForm({ ...form, email: val });
    if (val.length > 0) {
      const res = emailSchema.safeParse(val);
      if (!res.success) {
        setEmailError(res.error.errors[0].message);
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  };

  const updateMutation = useMutation({
    mutationFn: () => UsersService.update(user.id, {
      name: form.name,
      email: form.email,
      role: form.role,
      phone: form.phone || undefined,
      isActive: form.isActive,
    }),
    onSuccess: () => {
      toast.success("Utilisateur mis à jour");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit2 className="w-3.5 h-3.5" /> Éditer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nom complet *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" />
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
            <Label>Téléphone (Français)</Label>
            <Input 
              value={form.phone} 
              onChange={(e) => handlePhoneChange(e.target.value)} 
              placeholder="0612345678" 
              className={phoneError ? "border-destructive" : ""}
            />
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Rôle *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as import("@/types").Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="technician">Technicien</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label>Compte Actif</Label>
            <input 
              type="checkbox"
              className="w-4 h-4 cursor-pointer"
              checked={form.isActive} 
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button 
            onClick={() => updateMutation.mutate()} 
            disabled={updateMutation.isPending || !form.name || !form.email || !!phoneError || !!emailError}
          >
            {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
