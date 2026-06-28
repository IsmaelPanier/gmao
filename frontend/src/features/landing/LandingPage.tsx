import React from "react";
import { Link } from "react-router-dom";
import {
  Wrench, ArrowRight, CalendarDays, Users, BarChart3,
  Shield, Zap, CheckCircle2, Clock, Camera, Bell,
  ClipboardList, MapPin, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: ClipboardList,
    title: "Gestion des interventions",
    desc: "Créez, assignez et suivez chaque intervention avec un statut en temps réel. Machine à états complète de la création à la clôture.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: CalendarDays,
    title: "Planning drag & drop",
    desc: "Visualisez et réorganisez vos missions sur un calendrier interactif. Glissez-déposez pour replanifier en un instant.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Users,
    title: "Gestion d'équipe",
    desc: "Invitez vos techniciens et managers par email. Contrôle d'accès par rôle — chacun voit uniquement ce qui le concerne.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Camera,
    title: "Photos & signatures",
    desc: "Vos techniciens uploadent photos et signatures directement depuis le terrain. Tout est archivé sur chaque intervention.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Bell,
    title: "Notifications temps réel",
    desc: "Chaque changement de statut déclenche une notification instantanée. Plus besoin de relancer vos équipes.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: BarChart3,
    title: "Dashboard & analytics",
    desc: "Statistiques en un coup d'œil — interventions du jour, taux de complétion, charge par technicien, priorités.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const workflow = [
  { step: "01", title: "Créez une intervention", desc: "Renseignez le type, la priorité, le client et assignez un ou plusieurs techniciens." },
  { step: "02", title: "Le technicien accepte", desc: "Il reçoit une notification, accepte la mission et démarre le pointage sur le terrain." },
  { step: "03", title: "Suivi en direct", desc: "Le manager suit l'avancement en temps réel : statut, localisation, photos uploadées." },
  { step: "04", title: "Clôture & rapport", desc: "Le technicien signe, clôture l'intervention. La durée réelle est calculée automatiquement." },
];

const roles = [
  {
    label: "Admin",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400",
    items: ["Gestion complète des utilisateurs", "Audit trail de toutes les actions", "Paramètres de l'organisation", "Accès à tous les rapports"],
  },
  {
    label: "Manager",
    color: "border-violet-500/30 bg-violet-500/5",
    badge: "bg-violet-500/15 text-violet-400",
    items: ["Création et gestion des clients", "Planification des interventions", "Assignation des techniciens", "Dashboard et statistiques"],
  },
  {
    label: "Technicien",
    color: "border-emerald-500/30 bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-400",
    items: ["Mes missions du jour", "Pointage START / PAUSE / END", "Upload photos & signature", "Accepter / refuser une mission"],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight">TEX Pro</span>
            <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">GMAO</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Rôles</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register" className="gap-1.5">
                Commencer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Zap className="w-3 h-3" />
            Field Service Management — Gratuit, auto-hébergé
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Gérez vos interventions
            <br />
            <span className="text-primary">terrain, simplement.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            TEX Pro centralise la planification, le suivi terrain et le reporting de vos équipes
            de maintenance en une seule application. En temps réel.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="h-12 px-8 gap-2 text-base">
              <Link to="/register">
                Créer mon espace <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 gap-2 text-base">
              <Link to="/login">
                Voir la démo <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Comptes démo disponibles sur la page de connexion · Aucune carte bancaire requise
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {[
            { value: "3", label: "Rôles distincts" },
            { value: "6", label: "Statuts d'intervention" },
            { value: "∞", label: "Techniciens" },
            { value: "100%", label: "Temps réel" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-card p-6 text-center">
              <div className="text-3xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Fonctionnalités</div>
            <h2 className="text-3xl font-bold tracking-tight">Tout ce dont vous avez besoin</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              De la création à la clôture, chaque étape de la vie d'une intervention est couverte.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-sm transition-all duration-200 group"
              >
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="py-24 px-6 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Processus</div>
            <h2 className="text-3xl font-bold tracking-tight">Comment ça marche</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Un flux simple du bureau au terrain, pensé pour les équipes de maintenance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-border -translate-x-3 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mb-4">
                    {step}
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Accès & Permissions</div>
            <h2 className="text-3xl font-bold tracking-tight">Un rôle pour chacun</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Chaque profil dispose d'un accès adapté à ses responsabilités.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {roles.map(({ label, color, badge, items }) => (
              <div key={label} className={`rounded-xl border p-6 ${color}`}>
                <div className={`inline-block text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-5 ${badge}`}>
                  {label}
                </div>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="py-24 px-6 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, title: "Sécurisé", desc: "JWT + refresh token rotation, RBAC strict, audit trail complet" },
              { icon: Zap, title: "Temps réel", desc: "WebSocket Socket.io — statuts et notifications instantanés" },
              { icon: MapPin, title: "Auto-hébergé", desc: "Docker Compose, PostgreSQL, MinIO — vos données restent chez vous" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold mb-1">{title}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Prêt à démarrer ?</h2>
          <p className="text-muted-foreground mb-8">
            Créez votre espace en 2 minutes. Votre compte sera administrateur
            et vous pourrez immédiatement inviter votre équipe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="h-12 px-8 gap-2">
              <Link to="/register">
                Créer mon compte <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
              <Link to="/login">J'ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm">TEX Pro</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 TEX Pro · Gestion de Maintenance Assistée par Ordinateur</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Connexion</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
