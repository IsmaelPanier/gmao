import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api, { getApiError } from "@/services/api";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">TEX Pro</span>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Mot de passe réinitialisé</h2>
            <p className="text-sm text-muted-foreground">
              Votre mot de passe a été mis à jour. Vous allez être redirigé vers la page de connexion…
            </p>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/login">
                <ArrowLeft className="w-4 h-4 mr-2" /> Se connecter
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Nouveau mot de passe</h2>
              <p className="text-sm text-muted-foreground">
                Choisissez un mot de passe sécurisé d'au moins 8 caractères avec une majuscule et un chiffre.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
