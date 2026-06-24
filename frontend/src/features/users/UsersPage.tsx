import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UsersService from "@/services/users.service";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { useAuth } from "@/features/auth/AuthContext";

export default function UsersPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["users", { q }],
    queryFn: () => UsersService.list({ q, limit: 100 }),
  });

  const users = data?.data ?? [];
  const canManageUsers = ["admin", "manager"].includes(user?.role ?? "");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Équipe</div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
        </div>
        {canManageUsers && <CreateUserDialog />}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="p-4">Chargement...</div>}
        {users.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{u.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Shield className="w-3 h-3" />
                  <span className="uppercase tracking-wider font-medium">{u.role}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={u.isActive ? "default" : "destructive"}>{u.isActive ? "Actif" : "Inactif"}</Badge>
                {canManageUsers && <EditUserDialog user={u} />}
              </div>
            </div>
            <div className="space-y-1 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {u.email}</div>
              {u.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {u.phone}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
