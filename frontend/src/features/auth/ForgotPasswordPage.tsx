import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api, { getApiError } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg">TEX Pro</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Email envoyé</h2>
            <p className="text-sm text-muted-foreground">
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation valable <strong>1 heure</strong>.
            </p>
            <p className="text-xs text-muted-foreground">Pensez à vérifier vos spams.</p>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/login">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Mot de passe oublié ?</h2>
              <p className="text-sm text-muted-foreground">
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Envoyer le lien
                  </>
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
