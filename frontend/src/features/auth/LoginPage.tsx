import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiError } from "@/services/api";
import { Wrench, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const features = [
  { icon: Shield, title: "Sécurisé", desc: "Authentification JWT avec rotation des tokens" },
  { icon: Zap, title: "Temps réel", desc: "Suivi des interventions en direct" },
  { icon: BarChart3, title: "Analytics", desc: "Tableaux de bord et rapports avancés" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie !");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* ─── Left panel ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gmao-900">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, rgba(0,47,167,0.4) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-between p-14 text-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gmao-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">TEX Pro</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-0.5">Field Service Management</div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tight leading-tight mb-4">
                Gérez vos interventions.<br />
                <span className="text-gmao-100/70">Simplement.</span>
              </h1>
              <p className="text-white/60 text-base leading-relaxed max-w-sm">
                Planification, suivi terrain et reporting en temps réel pour vos équipes de maintenance.
              </p>
            </div>

            <div className="grid gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="w-8 h-8 bg-gmao-600/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-gmao-100" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{title}</div>
                    <div className="text-white/50 text-xs mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-white/30">© 2026 TEX Pro. Tous droits réservés.</div>
        </div>
      </div>

      {/* ─── Right panel ────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-background">
        <div className="max-w-sm w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg">TEX Pro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Bienvenue</h2>
            <p className="text-muted-foreground text-sm">
              Connectez-vous à votre espace de gestion
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 gap-2 group">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-10 pt-8 border-t border-border">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Comptes de démonstration
            </div>
            <div className="space-y-2">
              {[
                { email: "admin@gmao.fr", password: "Admin1234!", role: "Admin" },
                { email: "manager@gmao.fr", password: "Manager1234!", role: "Manager" },
                { email: "tech1@gmao.fr", password: "Tech1234!", role: "Technicien" },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted rounded-lg px-3 py-2.5 text-xs transition-colors border border-transparent hover:border-border"
                >
                  <span className="font-mono text-foreground">{acc.email}</span>
                  <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
