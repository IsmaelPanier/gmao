import React from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Wrench, LayoutDashboard, Users, Briefcase, Calendar, ClipboardList,
  UserCog, LogOut, Menu, X
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/api";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin", "responsable", "technicien", "client"], testid: "nav-dashboard" },
  { to: "/interventions", label: "Interventions", icon: ClipboardList, roles: ["admin", "responsable"], testid: "nav-interventions" },
  { to: "/mes-interventions", label: "Mes interventions", icon: Briefcase, roles: ["technicien"], testid: "nav-my-interventions" },
  { to: "/planning", label: "Planning", icon: Calendar, roles: ["admin", "responsable", "technicien"], testid: "nav-planning" },
  { to: "/clients", label: "Clients", icon: Users, roles: ["admin", "responsable"], testid: "nav-clients" },
  { to: "/utilisateurs", label: "Utilisateurs", icon: UserCog, roles: ["admin"], testid: "nav-users" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();

  React.useEffect(() => { setOpen(false); }, [loc.pathname]);

  if (!user) return null;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  const Sidebar = (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-zinc-200 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#002FA7] flex items-center justify-center rounded-sm">
          <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none tracking-tight">GMAO Pro</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Field Service</div>
        </div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm border-l-2 transition-fast ${
                  isActive
                    ? "border-[#002FA7] bg-zinc-50 text-zinc-900 font-semibold"
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {n.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-zinc-900 text-white rounded-sm flex items-center justify-center font-semibold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate" data-testid="user-name">{user.name}</div>
            <div className="text-xs text-zinc-500">{ROLE_LABELS[user.role]}</div>
          </div>
        </div>
        <Button
          data-testid="logout-button"
          variant="outline"
          size="sm"
          className="w-full rounded-sm"
          onClick={async () => { await logout(); nav("/login"); }}
        >
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex">
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <button data-testid="menu-toggle" onClick={() => setOpen(true)} className="p-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#002FA7]" />
            <span className="font-display font-bold">GMAO Pro</span>
          </div>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
