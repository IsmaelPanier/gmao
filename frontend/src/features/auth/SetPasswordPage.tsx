import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import AuthService from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function SetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [activated, setActivated] = useState(false);

  const { data: tokenInfo, isLoading, isError } = useQuery({
    queryKey: ["activation-token", token],
    queryFn: () => AuthService.validateActivationToken(token!),
    enabled: !!token,
    retry: false,
  });

  const activateMutation = useMutation({
    mutationFn: () => AuthService.activateAccount(token!, password),
    onSuccess: () => {
      setActivated(true);
      toast.success("Compte activé ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password === confirm;
  const canSubmit = passwordValid && passwordsMatch && !activateMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Lien invalide ou expiré</h1>
          <p className="text-muted-foreground">Ce lien d'activation est invalide ou a expiré (validité : 24h). Contactez votre gestionnaire pour en obtenir un nouveau.</p>
          <Button onClick={() => navigate("/login")} variant="outline">Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  if (activated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Compte activé !</h1>
          <p className="text-muted-foreground">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Activer mon compte</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue, <strong>{tokenInfo?.name}</strong> ! Définissez votre mot de passe pour accéder à GMAO Pro.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={tokenInfo?.email ?? ""} disabled className="bg-muted" />
          </div>

          <div className="space-y-1.5">
            <Label>Mot de passe *</Label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <ul className="text-xs space-y-1 mt-1">
                <li className={password.length >= 8 ? "text-green-600" : "text-destructive"}>
                  {password.length >= 8 ? "✓" : "✗"} Minimum 8 caractères
                </li>
                <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-destructive"}>
                  {/[A-Z]/.test(password) ? "✓" : "✗"} Au moins une majuscule
                </li>
                <li className={/[0-9]/.test(password) ? "text-green-600" : "text-destructive"}>
                  {/[0-9]/.test(password) ? "✓" : "✗"} Au moins un chiffre
                </li>
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Confirmer le mot de passe *</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              className={confirm.length > 0 && !passwordsMatch ? "border-destructive" : ""}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={() => activateMutation.mutate()}
            disabled={!canSubmit}
          >
            {activateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activation...</>
            ) : (
              "Activer mon compte"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
