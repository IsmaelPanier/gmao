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
import { Plus, Mail, CheckCircle2 } from "lucide-react";

const PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

export function CreateUserDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; activationUrl?: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "technician" });
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const createMutation = useMutation({
    mutationFn: UsersService.create,
    onSuccess: (user: any) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users-techs"] });
      setCreated({ name: form.name, email: form.email, activationUrl: user.activationUrl });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handlePhoneChange = (val: string) => {
    let newVal = val.replace(/[^\d\s.\-+]/g, "");
    const digitsOnly = newVal.replace(/\D/g, "");
    const hasPlus = newVal.startsWith("+");
    const maxDigits = hasPlus ? 11 : 10;
    if (digitsOnly.length > maxDigits) return;
    setForm({ ...form, phone: newVal });
    setPhoneError(newVal && !PHONE_REGEX.test(newVal) ? "Numéro français invalide (ex: 0612345678)" : "");
  };

  const handleEmailChange = (val: string) => {
    setForm({ ...form, email: val });
    setEmailError(val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "Format d'email invalide" : "");
  };

  const isFormValid = form.name.length >= 2 && form.email.includes("@") && !emailError && !phoneError;

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setCreated(null);
      setForm({ name: "", email: "", phone: "", role: "technician" });
      setPhoneError("");
      setEmailError("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Créer un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Compte créé avec succès</p>
                <p className="text-sm text-green-700 mt-1">
                  Un email d'activation a été envoyé à <strong>{created.email}</strong>.
                </p>
                <p className="text-sm text-green-700">
                  {created.name} devra cliquer sur le lien pour définir son mot de passe et activer son compte.
                </p>
              </div>
            </div>
            {created.activationUrl && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lien d'activation (dev)</p>
                <div className="flex items-center gap-2">
                  <Input value={created.activationUrl} readOnly className="text-xs font-mono bg-muted" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(created.activationUrl!); toast.success("Lien copié"); }}
                  >
                    Copier
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Un email d'activation sera envoyé automatiquement. L'utilisateur définira son mot de passe lui-même.
                </p>
              </div>
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
                <Label>Téléphone (optionnel)</Label>
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
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button
                onClick={() => createMutation.mutate(form as any)}
                disabled={createMutation.isPending || !isFormValid}
              >
                {createMutation.isPending ? "Création..." : "Créer et envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
